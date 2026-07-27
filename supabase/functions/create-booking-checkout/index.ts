import { createClient } from 'npm:@supabase/supabase-js@2'
import { normalizeE164 } from '../_shared/phone.ts'

type CheckoutBody = {
  courtId?: string
  date?: string
  time?: string
  customerName?: string
  customerPhone?: string
  customerPhoneCountryCode?: string
  customerEmail?: string
  customerDocumentType?: string
  customerDocument?: string
  acceptsMarketing?: boolean
  acceptsWhatsApp?: boolean
  acceptsTerms?: boolean
  termsVersion?: string
}

type CourtRate = { hora_inicio: string; hora_fin: string; precio_minor: number | null; moneda_codigo: string | null; dias_semana: number[] | null }
type Reservation = { hora_inicio_local: string; hora_fin_local: string; estado_reserva: string; creado_en: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const blockingStatuses = ['pendiente_pago', 'confirmada']
const bookingHoldMinutes = Number(Deno.env.get('BOOKING_HOLD_MINUTES') ?? '7')
const bookingHoldMs = bookingHoldMinutes * 60 * 1000
const currentTermsVersion = '2026-07-27'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  let reservationId = ''
  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)

    const body = await request.json().catch(() => null) as CheckoutBody | null
    const input = validateBody(body)
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    await expireOldPendingBookings(adminClient)

    const { data: court, error: courtError } = await adminClient.from('canchas_publicas').select('*').eq('id', input.courtId).maybeSingle()
    if (courtError) return json({ error: courtError.message }, 400)
    if (!court?.id || !court.negocio_id) return json({ error: 'Cancha no disponible.' }, 404)

    const [{ data: business, error: businessError }, { data: rates, error: ratesError }, { data: reservations, error: reservationsError }] = await Promise.all([
      adminClient.from('negocios_publicos').select('*').eq('id', court.negocio_id).maybeSingle(),
      adminClient.from('cancha_tarifas').select('hora_inicio, hora_fin, precio_minor, moneda_codigo, dias_semana').eq('cancha_id', court.id).eq('activa', true).order('hora_inicio'),
      adminClient.from('reservas').select('hora_inicio_local, hora_fin_local, estado_reserva, creado_en').eq('cancha_id', court.id).eq('fecha_local', input.date).in('estado_reserva', blockingStatuses),
    ])
    if (businessError || ratesError || reservationsError) return json({ error: businessError?.message ?? ratesError?.message ?? reservationsError?.message }, 400)
    if (!business?.id) return json({ error: 'Club no disponible.' }, 404)

    const { data: country, error: countryError } = await adminClient
      .from('paises')
      .select('codigo_iso2, indicativo_pais')
      .eq('codigo_iso2', input.customerPhoneCountryCode)
      .eq('activo', true)
      .maybeSingle()
    if (countryError) return json({ error: countryError.message }, 400)
    const customerPhoneE164 = normalizeE164(input.customerPhone, country?.indicativo_pais)
    if (!customerPhoneE164) return json({ error: 'Ingresa un telefono valido con su indicativo de pais.' }, 400)

    const endTime = addHour(input.time)
    if (overlapsReservation(input.time, endTime, reservations ?? [])) return json({ error: 'Ese horario ya esta reservado.' }, 409)

    const price = priceForSlot({
      date: input.date,
      time: input.time,
      rates: rates ?? [],
      fallbackPrice: court.precio_por_hora_minor ?? 0,
      fallbackCurrency: court.moneda ?? business.moneda ?? 'COP',
    })
    if (price.amountMinor <= 0) return json({ error: 'La cancha no tiene precio configurado.' }, 400)

    const reference = `RAPI-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
    const timezone = business.zona_horaria ?? business.timezone ?? 'America/Bogota'
    const reservationInsert = {
      cancha_id: court.id,
      negocio_id: business.id,
      fecha_local: input.date,
      hora_inicio_local: input.time,
      hora_fin_local: endTime,
      inicio_at: toUtcIso(input.date, input.time, timezone),
      fin_at: toUtcIso(input.date, endTime, timezone),
      nombre_cliente: input.customerName,
      telefono_cliente: customerPhoneE164,
      telefono_cliente_e164: input.acceptsWhatsApp ? customerPhoneE164 : null,
      email_cliente: input.customerEmail || null,
      acepta_marketing_negocio: input.acceptsMarketing,
      acepta_notificaciones_whatsapp: input.acceptsWhatsApp,
      acepta_terminos: true,
      terminos_version: input.termsVersion,
      terminos_aceptados_en: new Date().toISOString(),
      moneda: price.currency,
      precio_total_minor: price.amountMinor,
      timezone,
      estado_reserva: 'pendiente_pago',
      origen: 'web',
      referencia_publica: reference,
    }

    const { data: reservation, error: reservationError } = await adminClient.from('reservas').insert(reservationInsert).select('id, referencia_publica').single()
    if (reservationError) return json({ error: reservationError.message }, 400)
    reservationId = reservation.id

    const platformFeeMinor = Math.round(price.amountMinor * 0.1)
    const netMinor = price.amountMinor - platformFeeMinor
    const providerInvoice = `${reference}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
    const { data: payment, error: paymentError } = await adminClient.from('pagos').insert({
      negocio_id: business.id,
      reserva_id: reservation.id,
      tipo_pago: 'reserva',
      estado: 'pending',
      moneda: price.currency,
      monto_total_minor: price.amountMinor,
      comision_plataforma_minor: platformFeeMinor,
      neto_negocio_minor: netMinor,
      payment_provider: 'epayco',
      provider_reference: reference,
      provider_account_id: business.provider_account_id ?? null,
      provider_payload: { checkout: 'pending', providerInvoice },
    }).select('id').single()
    if (paymentError) throw paymentError

    const session = await createEpaycoSession({
      amountMinor: price.amountMinor,
      currency: price.currency,
      reference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerCallingCode: country?.indicativo_pais ?? '',
      customerEmail: input.customerEmail,
      customerDocumentType: input.customerDocumentType,
      customerDocument: input.customerDocument,
      businessName: business.nombre ?? 'Rapicancha',
      courtName: court.nombre ?? 'Cancha',
      providerInvoice,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('cf-connecting-ip') ?? '127.0.0.1',
      responseUrl: `${appPublicUrl()}/checkout/${reference}/respuesta`,
      confirmationUrl: `${supabaseUrl}/functions/v1/epayco-webhook`,
    })

    await adminClient.from('pagos').update({
      provider_checkout_id: session.sessionId,
      provider_payment_id: session.sessionId,
      provider_payload: {
        checkout: 'created',
        providerInvoice,
        sessionId: session.sessionId,
        test: Deno.env.get('EPAYCO_ENV') !== 'production',
      },
    }).eq('id', payment.id)

    return json({
      reservationReference: reference,
      paymentId: payment.id,
      provider: 'epayco',
      sessionId: session.sessionId,
      test: Deno.env.get('EPAYCO_ENV') !== 'production',
      courtName: court.nombre ?? 'Cancha',
      priceMinor: price.amountMinor,
      currency: price.currency,
    }, 200)
  } catch (error) {
    if (reservationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && secretKey) {
        const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
        await adminClient.from('reservas').update({ estado_reserva: 'expirada' }).eq('id', reservationId)
      }
    }
    return json({ error: error instanceof Error ? error.message : 'No se pudo crear el checkout.' }, 500)
  }
})

function validateBody(body: CheckoutBody | null) {
  const courtId = body?.courtId?.trim()
  const date = body?.date?.trim()
  const time = body?.time?.trim()
  const customerName = body?.customerName?.trim()
  const customerPhone = body?.customerPhone?.trim()
  const customerPhoneCountryCode = body?.customerPhoneCountryCode?.trim().toUpperCase()
  const customerEmail = body?.customerEmail?.trim() ?? ''
  const customerDocumentType = body?.customerDocumentType?.trim() || 'CC'
  const customerDocument = body?.customerDocument?.trim()
  if (!courtId) throw new Error('Cancha requerida.')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Fecha invalida.')
  if (!time || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Hora invalida.')
  if (!customerName || customerName.length < 3) throw new Error('Nombre requerido.')
  if (!customerPhone || customerPhone.length < 7) throw new Error('Telefono requerido.')
  if (!customerPhoneCountryCode || !/^[A-Z]{2}$/.test(customerPhoneCountryCode)) throw new Error('Indicativo de pais requerido.')
  if (!customerDocument || customerDocument.length < 5) throw new Error('Documento requerido.')
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new Error('Correo invalido.')
  if (body?.acceptsTerms !== true) throw new Error('Debes aceptar los terminos y condiciones.')
  if (body?.termsVersion !== currentTermsVersion) throw new Error('Los terminos cambiaron. Recarga la pagina y vuelve a aceptarlos.')
  return {
    courtId,
    date,
    time,
    customerName,
    customerPhone,
    customerPhoneCountryCode,
    customerEmail,
    customerDocumentType,
    customerDocument,
    acceptsMarketing: Boolean(body?.acceptsMarketing),
    acceptsWhatsApp: Boolean(body?.acceptsWhatsApp),
    acceptsTerms: true,
    termsVersion: currentTermsVersion,
  }
}

async function createEpaycoSession(input: { amountMinor: number; currency: string; reference: string; providerInvoice: string; customerName: string; customerPhone: string; customerCallingCode: string; customerEmail: string; customerDocumentType: string; customerDocument: string; businessName: string; courtName: string; ip: string; responseUrl: string; confirmationUrl: string }) {
  const publicKey = requiredEnv('EPAYCO_PUBLIC_KEY')
  const privateKey = requiredEnv('EPAYCO_PRIVATE_KEY')
  const auth = btoa(`${publicKey}:${privateKey}`)
  const login = await fetch('https://apify.epayco.co/login', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
  })
  const loginBody = await login.json().catch(() => null)
  const token = loginBody?.token
  if (!login.ok || !token) throw new Error('ePayco no entrego token de autenticacion.')

  const sessionPayload = {
    checkout_version: '2',
    name: input.businessName,
    currency: input.currency,
    amount: amountForProvider(input.amountMinor, input.currency),
    taxBase: 0,
    tax: 0,
    taxIco: 0,
    description: `Reserva ${input.courtName}`,
    lang: 'ES',
    country: 'CO',
    test: Deno.env.get('EPAYCO_ENV') !== 'production',
    ip: input.ip,
    invoice: input.providerInvoice,
    ...(isPublicUrl(input.responseUrl) ? { response: input.responseUrl, forceResponse: true } : {}),
    confirmation: input.confirmationUrl,
    method: 'GET',
    extras: { extra1: input.reference, extra2: 'rapicancha', extra3: 'reserva' },
    billing: {
      email: input.customerEmail || undefined,
      name: input.customerName,
      address: 'No reportada',
      typeDoc: input.customerDocumentType,
      numberDoc: input.customerDocument,
      callingCode: input.customerCallingCode,
      mobilePhone: input.customerPhone,
    },
  }
  const session = await fetch('https://apify.epayco.co/payment/session/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionPayload),
  })
  const sessionBody = await session.json().catch(() => null)
  const sessionId = sessionBody?.data?.sessionId
  if (!session.ok || !sessionId) throw new Error(epaycoErrorMessage(sessionBody))
  return { sessionId }
}

function epaycoErrorMessage(body: unknown) {
  if (!body || typeof body !== 'object') return 'ePayco no pudo crear la sesion.'
  const payload = body as { textResponse?: string; data?: { errors?: Array<{ errorMessage?: string }> } }
  const details = payload.data?.errors?.map((item) => item.errorMessage).filter(Boolean).join(' | ')
  return details ? `${payload.textResponse ?? 'Error ePayco'}: ${details}` : payload.textResponse ?? 'ePayco no pudo crear la sesion.'
}

function isPublicUrl(value: string) {
  return /^https:\/\/.+/i.test(value) && !value.includes('127.0.0.1') && !value.includes('localhost')
}

function priceForSlot(input: { date: string; time: string; rates: CourtRate[]; fallbackPrice: number; fallbackCurrency: string }) {
  const weekday = weekdayForDate(input.date)
  const rate = input.rates.find((item) => (item.dias_semana ?? []).includes(weekday) && normalizeTime(item.hora_inicio) <= input.time && normalizeTime(item.hora_fin) >= addHour(input.time))
  return { amountMinor: rate?.precio_minor ?? input.fallbackPrice, currency: rate?.moneda_codigo ?? input.fallbackCurrency }
}

function overlapsReservation(start: string, end: string, reservations: Reservation[]) {
  const pendingLimit = Date.now() - bookingHoldMs
  return reservations.some((reservation) => {
    const blocks = reservation.estado_reserva === 'confirmada' || (reservation.estado_reserva === 'pendiente_pago' && new Date(reservation.creado_en).getTime() >= pendingLimit)
    return blocks && start < normalizeTime(reservation.hora_fin_local) && end > normalizeTime(reservation.hora_inicio_local)
  })
}

function weekdayForDate(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day === 0 ? 7 : day
}

function addHour(time: string) {
  return `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`
}

function normalizeTime(time: string) {
  return time.slice(0, 5)
}

function amountForProvider(amountMinor: number, currency: string) {
  return ['COP', 'CLP', 'PYG'].includes(currency) ? amountMinor : amountMinor / 100
}

function toUtcIso(date: string, time: string, timezone: string) {
  const offset = timezone === 'America/Bogota' ? '-05:00' : '-05:00'
  return new Date(`${date}T${time}:00${offset}`).toISOString()
}

async function expireOldPendingBookings(adminClient: ReturnType<typeof createClient>) {
  const cutoff = new Date(Date.now() - bookingHoldMs).toISOString()
  const { data } = await adminClient.from('reservas').select('id').eq('estado_reserva', 'pendiente_pago').lt('creado_en', cutoff)
  const ids = (data ?? []).map((item) => item.id).filter(Boolean)
  if (ids.length === 0) return
  await Promise.all([
    adminClient.from('reservas').update({ estado_reserva: 'expirada' }).in('id', ids),
    adminClient.from('pagos').update({ estado: 'failed' }).in('reserva_id', ids).eq('estado', 'pending'),
  ])
}

function appPublicUrl() {
  return Deno.env.get('APP_PUBLIC_URL') ?? 'http://127.0.0.1:5173'
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
