import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST' && request.method !== 'GET') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)

    const payload = await readPayload(request)
    if (!(await hasValidSignature(payload))) return json({ error: 'Firma ePayco invalida.' }, 401)

    const reference = readReference(payload)
    if (!reference) return json({ error: 'Referencia no recibida.' }, 400)
    const reservationReference = rapicanchaReference(reference)
    const references = Array.from(new Set([reference, reservationReference].filter(Boolean)))
    const referenceFilter = references
      .flatMap((item) => [`provider_reference.eq.${item}`, `provider_checkout_id.eq.${item}`, `provider_payment_id.eq.${item}`])
      .join(',')

    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: payment, error: paymentError } = await adminClient
      .from('pagos')
      .select('id, reserva_id')
      .or(referenceFilter)
      .maybeSingle()

    if (paymentError) return json({ error: paymentError.message }, 400)
    if (!payment?.id) return json({ ok: true, ignored: true, reason: 'Pago no encontrado' }, 200)

    const paid = isApproved(payload)
    const refunded = isRefunded(payload)
    const failed = isRejected(payload)
    const nextPaymentStatus = paid ? 'paid' : refunded ? 'refunded' : failed ? 'failed' : 'pending'
    const nextReservationStatus = paid ? 'confirmada' : refunded ? 'reembolsada' : failed ? 'expirada' : 'pendiente_pago'

    const { error: paymentUpdateError } = await adminClient.from('pagos').update({
      estado: nextPaymentStatus,
      provider_payment_id: readTransactionId(payload),
      provider_payload: payload,
    }).eq('id', payment.id)
    if (paymentUpdateError) throw new Error(`No se pudo actualizar el pago: ${paymentUpdateError.message}`)

    if (payment.reserva_id) {
      const { error: reservationUpdateError } = await adminClient
        .from('reservas')
        .update({ estado_reserva: nextReservationStatus })
        .eq('id', payment.reserva_id)
      if (reservationUpdateError) {
        throw new Error(`No se pudo actualizar la reserva: ${reservationUpdateError.message}`)
      }
      if (paid) await createBusinessBookingNotification(adminClient, payment.reserva_id)
    }

    return json({ ok: true, status: nextPaymentStatus }, 200)
  } catch (error) {
    console.error('[epayco-webhook]', error)
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  if (request.method === 'GET') return query

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  let body: Record<string, unknown> = {}

  if (contentType.includes('application/json')) {
    const parsed = await request.json().catch(() => null)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as Record<string, unknown>
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    body = Object.fromEntries((await request.formData()).entries())
  } else {
    const text = await request.text()
    if (text) body = Object.fromEntries(new URLSearchParams(text).entries())
  }

  return { ...query, ...body }
}

async function createBusinessBookingNotification(adminClient: ReturnType<typeof createClient>, reservationId: string) {
  const { data: reservation, error } = await adminClient
    .from('reservas')
    .select('id, negocio_id, cancha_id, referencia_publica, nombre_cliente, telefono_cliente, fecha_local, hora_inicio_local, hora_fin_local, precio_total_minor, moneda')
    .eq('id', reservationId)
    .maybeSingle()
  if (error || !reservation) return

  const { data: court } = await adminClient.from('canchas').select('nombre').eq('id', reservation.cancha_id).maybeSingle()
  const { error: notificationError } = await adminClient.from('notificaciones_negocio').upsert({
    negocio_id: reservation.negocio_id,
    reserva_id: reservation.id,
    tipo: 'reserva_confirmada',
    titulo: 'Nueva reserva confirmada',
    mensaje: `${reservation.nombre_cliente} reservo ${court?.nombre ?? 'una cancha'} el ${reservation.fecha_local} de ${reservation.hora_inicio_local.slice(0, 5)} a ${reservation.hora_fin_local.slice(0, 5)}.`,
    datos: { referencia: reservation.referencia_publica, nombreCliente: reservation.nombre_cliente, telefonoCliente: reservation.telefono_cliente, cancha: court?.nombre ?? null, fecha: reservation.fecha_local, horaInicio: reservation.hora_inicio_local, horaFin: reservation.hora_fin_local, precioTotalMinor: reservation.precio_total_minor, moneda: reservation.moneda },
  }, { onConflict: 'reserva_id,tipo', ignoreDuplicates: true })
  if (notificationError) console.error('No se pudo crear la notificacion del negocio:', notificationError.message)
}

function readReference(payload: Record<string, unknown>) {
  return stringValue(payload.x_extra1) || stringValue(payload.extra1) || stringValue(payload.invoice) || stringValue(payload.x_id_invoice) || stringValue(payload.reference) || stringValue(payload.ref_payco) || stringValue(payload.x_ref_payco)
}

function rapicanchaReference(reference: string) {
  const match = reference.match(/^(RAPI-[A-Z0-9]{16})/i)
  return match?.[1]?.toUpperCase() ?? reference
}

function readTransactionId(payload: Record<string, unknown>) {
  return stringValue(payload.transaction_id) || stringValue(payload.x_transaction_id) || stringValue(payload.ref_payco) || stringValue(payload.x_ref_payco) || readReference(payload)
}

function isApproved(payload: Record<string, unknown>) {
  const values = [payload.x_cod_response, payload.cod_response, payload.responseCode, payload.status, payload.x_response, payload.x_transaction_state, payload.x_cod_transaction_state].map(normalizeStatus)
  return values.some((value) => ['1', 'aceptada', 'accepted', 'approved', 'aprobada', 'ok', 'success', 'approvedtransaction'].includes(value))
}

function isRejected(payload: Record<string, unknown>) {
  const values = [payload.x_cod_response, payload.cod_response, payload.responseCode, payload.status, payload.x_response, payload.x_transaction_state, payload.x_cod_transaction_state].map(normalizeStatus)
  return values.some((value) => ['2', '4', '9', '10', '11', 'rechazada', 'rejected', 'failed', 'fallida', 'cancelada', 'cancelled', 'expired', 'caducada', 'abandonada', 'declined'].includes(value))
}

function isRefunded(payload: Record<string, unknown>) {
  const values = [payload.x_cod_response, payload.cod_response, payload.responseCode, payload.status, payload.x_response, payload.x_transaction_state, payload.x_cod_transaction_state].map(normalizeStatus)
  return values.some((value) => ['6', 'reversada', 'reversed', 'refunded', 'reembolsada'].includes(value))
}

function normalizeStatus(value: unknown) {
  return stringValue(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

async function hasValidSignature(payload: Record<string, unknown>) {
  const signature = stringValue(payload.x_signature)
  const custId = Deno.env.get('EPAYCO_P_CUST_ID_CLIENTE')
  const pKey = Deno.env.get('EPAYCO_P_KEY')
  if (!custId || !pKey) throw new Error('La validacion de firma ePayco no esta configurada.')
  if (!signature) return false

  const source = [
    custId,
    pKey,
    stringValue(payload.x_ref_payco),
    stringValue(payload.x_transaction_id),
    stringValue(payload.x_amount),
    stringValue(payload.x_currency_code),
  ].join('^')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return expected === signature.toLowerCase()
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
