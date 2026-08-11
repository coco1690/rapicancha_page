import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)
  try {
    const body = await request.json().catch(() => null) as { reference?: string } | null
    const reference = body?.reference?.trim().toUpperCase() ?? ''
    if (!/^(EVT|EVO)-[A-Z0-9]{20}$/.test(reference)) return json({ error: 'Referencia invalida.' }, 400)
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) throw new Error('Supabase service role no esta configurado.')
    const db = createClient(requiredEnv('SUPABASE_URL'), secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    if (reference.startsWith('EVO-')) return await orderPaymentStatus(db, reference)
    const { data: registration, error } = await db.from('inscripciones_evento').select('*').eq('referencia_publica', reference).maybeSingle()
    if (error) throw error
    if (!registration) return json({ error: 'Inscripcion no encontrada.' }, 404)
    if (registration.estado === 'pendiente_pago' && registration.expira_en && new Date(registration.expira_en).getTime() <= Date.now()) {
      await db.from('inscripciones_evento').update({ estado: 'cancelada' }).eq('id', registration.id)
      registration.estado = 'cancelada'
    }
    const [{ data: event }, { data: modality }, { data: participant }, { data: business }, { data: payment }] = await Promise.all([
      db.from('eventos').select('nombre, slug, inicio_at, zona_horaria').eq('id', registration.evento_id).maybeSingle(),
      db.from('modalidades_evento').select('nombre').eq('id', registration.modalidad_evento_id).maybeSingle(),
      db.from('participantes').select('nombres, apellidos').eq('id', registration.participante_id).maybeSingle(),
      db.from('negocios').select('nombre, slug').eq('id', registration.negocio_id).maybeSingle(),
      db.from('pagos').select('estado').eq('inscripcion_evento_id', registration.id).order('creado_en', { ascending: false }).limit(1).maybeSingle(),
    ])
    return json({ ok: true, status: payment?.estado ?? (registration.estado === 'pendiente_pago' ? 'pending' : registration.estado === 'reembolsada' ? 'refunded' : registration.estado === 'cancelada' ? 'failed' : 'paid'), reference, registration: { number: registration.numero_inscripcion, bib: registration.numero_dorsal, shirtSize: registration.talla_camiseta, totalMinor: registration.total_minor, currency: registration.moneda_codigo, participantName: participant ? `${participant.nombres} ${participant.apellidos}` : '', eventName: event?.nombre ?? '', eventSlug: event?.slug ?? '', eventStart: event?.inicio_at ?? '', timezone: event?.zona_horaria ?? 'America/Bogota', modalityName: modality?.nombre ?? '', businessName: business?.nombre ?? '', businessSlug: business?.slug ?? '' } }, 200)
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500) }
})

async function orderPaymentStatus(db: ReturnType<typeof createClient>, reference: string) {
  const { data: order, error } = await db.from('ordenes_evento').select('*').eq('referencia_publica', reference).maybeSingle()
  if (error) throw error
  if (!order) return json({ error: 'Orden no encontrada.' }, 404)
  if (order.estado === 'pending' && new Date(order.expira_en).getTime() <= Date.now()) {
    await db.from('ordenes_evento').update({ estado: 'canceled' }).eq('id', order.id)
    await db.from('pagos').update({ estado: 'failed' }).eq('orden_evento_id', order.id).eq('estado', 'pending')
    order.estado = 'canceled'
  }
  const { data: registrations, error: registrationsError } = await db.from('inscripciones_evento')
    .select('numero_inscripcion, numero_dorsal, talla_camiseta, participante_id, modalidad_evento_id')
    .eq('orden_evento_id', order.id).order('created_at')
  if (registrationsError) throw registrationsError
  const participantIds = (registrations ?? []).map((item) => item.participante_id)
  const [{ data: participants }, { data: event }, { data: business }, { data: modality }, { data: payment }] = await Promise.all([
    participantIds.length ? db.from('participantes').select('id, nombres, apellidos').in('id', participantIds) : Promise.resolve({ data: [], error: null }),
    db.from('eventos').select('nombre, slug, inicio_at, zona_horaria').eq('id', order.evento_id).maybeSingle(),
    db.from('negocios').select('nombre, slug').eq('id', order.negocio_id).maybeSingle(),
    registrations?.[0] ? db.from('modalidades_evento').select('nombre').eq('id', registrations[0].modalidad_evento_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    db.from('pagos').select('estado').eq('orden_evento_id', order.id).order('creado_en', { ascending: false }).limit(1).maybeSingle(),
  ])
  const participantMap = new Map((participants ?? []).map((item) => [item.id, `${item.nombres} ${item.apellidos}`]))
  const items = (registrations ?? []).map((item) => ({
    number: item.numero_inscripcion, bib: item.numero_dorsal, shirtSize: item.talla_camiseta,
    participantName: participantMap.get(item.participante_id) ?? '',
  }))
  const status = order.estado !== 'pending' ? order.estado : payment?.estado ?? 'pending'
  return json({ ok: true, status: status === 'canceled' ? 'failed' : status, reference, registration: {
    number: reference, bib: null, shirtSize: null, totalMinor: order.total_minor,
    currency: order.moneda_codigo, participantName: order.comprador_nombre,
    eventName: event?.nombre ?? '', eventSlug: event?.slug ?? '', eventStart: event?.inicio_at ?? '',
    timezone: event?.zona_horaria ?? 'America/Bogota', modalityName: modality?.nombre ?? '',
    businessName: business?.nombre ?? '', businessSlug: business?.slug ?? '', quantity: order.cantidad,
    registrations: items,
  } }, 200)
}

function requiredEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`${name} no esta configurado.`); return value }
function json(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
