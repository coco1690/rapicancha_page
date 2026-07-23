import { createClient } from 'npm:@supabase/supabase-js@2'

type StatusBody = { reference?: string; providerReference?: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const body = await request.json().catch(() => null) as StatusBody | null
    const reference = body?.reference?.trim().toUpperCase() ?? ''
    const providerReference = body?.providerReference?.trim() ?? ''
    const hasInternalReference = /^RAPI-[A-Z0-9]{16}$/.test(reference)
    const hasProviderReference = /^[A-Za-z0-9_-]{3,128}$/.test(providerReference)
    if (!hasInternalReference && !hasProviderReference) return json({ error: 'Referencia invalida.' }, 400)

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })

    let paymentQuery = adminClient
      .from('pagos')
      .select('reserva_id, estado, provider_reference')
    paymentQuery = hasInternalReference
      ? paymentQuery.eq('provider_reference', reference)
      : paymentQuery.eq('provider_payment_id', providerReference)
    const { data: payment, error: paymentError } = await paymentQuery.maybeSingle()
    if (paymentError) return json({ error: paymentError.message }, 400)
    if (!payment?.reserva_id) return json({ error: 'Reserva no encontrada.' }, 404)
    const internalReference = payment.provider_reference?.trim().toUpperCase() ?? ''
    if (!/^RAPI-[A-Z0-9]{16}$/.test(internalReference)) return json({ error: 'Referencia interna no encontrada.' }, 404)

    const { data: reservation, error: reservationError } = await adminClient
      .from('reservas')
      .select('id, negocio_id, cancha_id, referencia_publica, fecha_local, hora_inicio_local, hora_fin_local, precio_total_minor, moneda, estado_reserva')
      .eq('id', payment.reserva_id)
      .maybeSingle()
    if (reservationError) return json({ error: reservationError.message }, 400)
    if (!reservation?.id || reservation.referencia_publica !== internalReference) return json({ error: 'Reserva no encontrada.' }, 404)

    const [{ data: business, error: businessError }, { data: court, error: courtError }] = await Promise.all([
      adminClient.from('negocios').select('nombre, slug, logo_url').eq('id', reservation.negocio_id).maybeSingle(),
      adminClient.from('canchas').select('nombre').eq('id', reservation.cancha_id).maybeSingle(),
    ])
    if (businessError || courtError) return json({ error: businessError?.message ?? courtError?.message }, 400)

    return json({
      ok: true,
      status: publicStatus(payment.estado, reservation.estado_reserva),
      reference: internalReference,
      reservation: {
        date: reservation.fecha_local,
        startTime: reservation.hora_inicio_local.slice(0, 5),
        endTime: reservation.hora_fin_local.slice(0, 5),
        priceMinor: reservation.precio_total_minor,
        currency: reservation.moneda,
        courtName: court?.nombre ?? 'Cancha',
        businessName: business?.nombre ?? 'Club',
        businessSlug: business?.slug ?? null,
        businessLogoUrl: business?.logo_url ?? null,
      },
    }, 200)
  } catch (error) {
    console.error('[booking-payment-status]', error)
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

function publicStatus(paymentStatus: string, reservationStatus: string) {
  if (paymentStatus === 'paid' && reservationStatus === 'confirmada') return 'confirmed'
  if (paymentStatus === 'failed' || ['cancelada', 'expirada'].includes(reservationStatus)) return 'failed'
  if (paymentStatus === 'refunded' || reservationStatus === 'reembolsada') return 'refunded'
  return 'pending'
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
  })
}
