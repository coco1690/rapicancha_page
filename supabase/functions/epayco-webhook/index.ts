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

    const payload = request.method === 'GET' ? Object.fromEntries(new URL(request.url).searchParams.entries()) : await request.json().catch(async () => Object.fromEntries((await request.formData()).entries()))
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
    const failed = isRejected(payload)
    const nextPaymentStatus = paid ? 'paid' : failed ? 'failed' : 'pending'
    const nextReservationStatus = paid ? 'confirmada' : failed ? 'expirada' : 'pendiente_pago'

    await adminClient.from('pagos').update({
      estado: nextPaymentStatus,
      provider_payment_id: readTransactionId(payload),
      provider_payload: payload,
    }).eq('id', payment.id)

    if (payment.reserva_id) {
      await adminClient.from('reservas').update({ estado_reserva: nextReservationStatus }).eq('id', payment.reserva_id)
    }

    return json({ ok: true, status: nextPaymentStatus }, 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

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
  const values = [payload.x_cod_response, payload.cod_response, payload.responseCode, payload.status, payload.x_response].map((value) => stringValue(value).toLowerCase())
  return values.some((value) => ['1', 'aceptada', 'accepted', 'approved', 'aprobada', 'ok', 'success'].includes(value))
}

function isRejected(payload: Record<string, unknown>) {
  const values = [payload.x_cod_response, payload.cod_response, payload.responseCode, payload.status, payload.x_response].map((value) => stringValue(value).toLowerCase())
  return values.some((value) => ['2', '3', '4', 'rechazada', 'rejected', 'failed', 'fallida', 'cancelada', 'cancelled', 'expired'].includes(value))
}

async function hasValidSignature(payload: Record<string, unknown>) {
  const signature = stringValue(payload.x_signature)
  const custId = Deno.env.get('EPAYCO_P_CUST_ID_CLIENTE')
  const pKey = Deno.env.get('EPAYCO_P_KEY')
  if (!signature || !custId || !pKey) return true

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
