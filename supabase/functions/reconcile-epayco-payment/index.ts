import { createClient } from 'npm:@supabase/supabase-js@2'

type ReconcileBody = { reference?: string; providerResponse?: unknown }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const body = await request.json().catch(() => null) as ReconcileBody | null
    const reference = body?.reference?.trim().toUpperCase() ?? ''
    if (!/^RAPI-[A-Z0-9]{16}$/.test(reference)) return json({ error: 'Referencia invalida.' }, 400)

    const providerReference = readProviderReference(body?.providerResponse)
    if (!providerReference) return json({ ok: true, confirmed: false, status: 'pending', reason: 'ePayco no entrego la referencia de validacion.' }, 200)

    const validationResponse = await fetch(`https://secure.epayco.co/validation/v1/reference/${encodeURIComponent(providerReference)}`, { headers: { 'Content-Type': 'application/json' } })
    const validationBody = await validationResponse.json().catch(() => null)
    if (!validationResponse.ok || !validationBody) return json({ error: 'No se pudo validar la transaccion con ePayco.' }, 502)
    const transaction = unwrapTransaction(validationBody)

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: payment, error: paymentError } = await adminClient
      .from('pagos')
      .select('id, reserva_id, monto_total_minor, moneda, provider_payload')
      .eq('provider_reference', reference)
      .maybeSingle()
    if (paymentError) return json({ error: paymentError.message }, 400)
    if (!payment?.id || !payment.reserva_id) return json({ error: 'Pago no encontrado.' }, 404)

    if (!belongsToPayment(transaction, reference, payment.provider_payload)) return json({ error: 'La transaccion no pertenece a esta reserva.' }, 409)
    if (!matchesAmount(transaction, payment.monto_total_minor, payment.moneda)) return json({ error: 'El monto o la moneda no coincide con la reserva.' }, 409)

    const approved = isApproved(transaction)
    const refunded = isRefunded(transaction)
    const rejected = isRejected(transaction)
    if (!approved && !refunded && !rejected) return json({ ok: true, confirmed: false, status: 'pending' }, 200)

    const paymentStatus = approved ? 'paid' : refunded ? 'refunded' : 'failed'
    const reservationStatus = approved ? 'confirmada' : refunded ? 'reembolsada' : 'expirada'
    const transactionId = readTransactionId(transaction) || providerReference
    const { error: updatePaymentError } = await adminClient.from('pagos').update({ estado: paymentStatus, provider_payment_id: transactionId, provider_payload: transaction }).eq('id', payment.id)
    if (updatePaymentError) return json({ error: updatePaymentError.message }, 400)
    const { error: updateReservationError } = await adminClient.from('reservas').update({ estado_reserva: reservationStatus }).eq('id', payment.reserva_id)
    if (updateReservationError) return json({ error: updateReservationError.message }, 400)
    if (approved) await createBusinessBookingNotification(adminClient, payment.reserva_id)

    return json({ ok: true, confirmed: approved, status: paymentStatus }, 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

function unwrapTransaction(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  const payload = value as Record<string, unknown>
  if (payload.data && typeof payload.data === 'object') return payload.data as Record<string, unknown>
  return payload
}

function readProviderReference(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const payload = value as Record<string, unknown>
  const direct = stringValue(payload.ref_payco) || stringValue(payload.x_ref_payco) || stringValue(payload.refPayco)
  if (direct) return direct
  return payload.data && typeof payload.data === 'object' ? readProviderReference(payload.data) : ''
}

function belongsToPayment(transaction: Record<string, unknown>, reference: string, providerPayload: unknown) {
  const extraReference = stringValue(transaction.x_extra1) || stringValue(transaction.extra1)
  if (extraReference) return extraReference.toUpperCase() === reference
  const invoice = stringValue(transaction.x_id_invoice) || stringValue(transaction.invoice)
  const expectedInvoice = providerPayload && typeof providerPayload === 'object' ? stringValue((providerPayload as Record<string, unknown>).providerInvoice) : ''
  return Boolean(invoice) && (invoice.toUpperCase().startsWith(reference) || invoice === expectedInvoice)
}

function matchesAmount(transaction: Record<string, unknown>, expectedMinor: number, expectedCurrency: string) {
  const amount = Number(stringValue(transaction.x_amount) || stringValue(transaction.amount))
  const currency = (stringValue(transaction.x_currency_code) || stringValue(transaction.currency)).toUpperCase()
  return Number.isFinite(amount) && Math.abs(amount - expectedMinor) < 0.01 && currency === expectedCurrency.toUpperCase()
}

function isApproved(payload: Record<string, unknown>) {
  return statusValues(payload).some((value) => ['1', 'aceptada', 'accepted', 'approved', 'aprobada', 'ok', 'success'].includes(value))
}

function isRejected(payload: Record<string, unknown>) {
  return statusValues(payload).some((value) => ['2', '4', '9', '10', '11', 'rechazada', 'rejected', 'failed', 'fallida', 'cancelada', 'cancelled', 'expired', 'caducada', 'abandonada', 'declined'].includes(value))
}

function isRefunded(payload: Record<string, unknown>) {
  return statusValues(payload).some((value) => ['6', 'reversada', 'reversed', 'refunded', 'reembolsada'].includes(value))
}

function statusValues(payload: Record<string, unknown>) {
  return [payload.x_cod_response, payload.x_response, payload.x_transaction_state, payload.x_cod_transaction_state, payload.status].map(normalizeStatus)
}

function normalizeStatus(value: unknown) {
  return stringValue(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function readTransactionId(payload: Record<string, unknown>) {
  return stringValue(payload.x_transaction_id) || stringValue(payload.transaction_id) || stringValue(payload.x_ref_payco) || stringValue(payload.ref_payco)
}

async function createBusinessBookingNotification(adminClient: ReturnType<typeof createClient>, reservationId: string) {
  const { data: reservation } = await adminClient.from('reservas').select('id, negocio_id, cancha_id, referencia_publica, nombre_cliente, telefono_cliente, fecha_local, hora_inicio_local, hora_fin_local, precio_total_minor, moneda').eq('id', reservationId).maybeSingle()
  if (!reservation) return
  const { data: court } = await adminClient.from('canchas').select('nombre').eq('id', reservation.cancha_id).maybeSingle()
  await adminClient.from('notificaciones_negocio').upsert({
    negocio_id: reservation.negocio_id,
    reserva_id: reservation.id,
    tipo: 'reserva_confirmada',
    titulo: 'Nueva reserva confirmada',
    mensaje: `${reservation.nombre_cliente} reservo ${court?.nombre ?? 'una cancha'} el ${reservation.fecha_local} de ${reservation.hora_inicio_local.slice(0, 5)} a ${reservation.hora_fin_local.slice(0, 5)}.`,
    datos: { referencia: reservation.referencia_publica, nombreCliente: reservation.nombre_cliente, telefonoCliente: reservation.telefono_cliente, cancha: court?.nombre ?? null, fecha: reservation.fecha_local, horaInicio: reservation.hora_inicio_local, horaFin: reservation.hora_fin_local, precioTotalMinor: reservation.precio_total_minor, moneda: reservation.moneda },
  }, { onConflict: 'reserva_id,tipo', ignoreDuplicates: true })
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
