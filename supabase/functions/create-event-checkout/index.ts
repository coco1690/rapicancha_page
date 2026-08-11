import { createClient } from 'npm:@supabase/supabase-js@2'

type Body = { reference?: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)
  try {
    const body = await request.json().catch(() => null) as Body | null
    const reference = body?.reference?.trim().toUpperCase() ?? ''
    if (!/^(EVT|EVO)-[A-Z0-9]{20}$/.test(reference)) return json({ error: 'Referencia de inscripcion invalida.' }, 400)

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) throw new Error('Supabase service role no esta configurado.')
    const db = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    if (reference.startsWith('EVO-')) return await createOrderCheckout(request, db, supabaseUrl, reference)

    const { data: registration, error } = await db.from('inscripciones_evento').select('*').eq('referencia_publica', reference).maybeSingle()
    if (error) throw error
    if (!registration) return json({ error: 'Inscripcion no encontrada.' }, 404)
    if (registration.estado !== 'pendiente_pago') return json({ error: 'La inscripcion ya no esta pendiente de pago.' }, 409)
    if (!registration.expira_en || new Date(registration.expira_en).getTime() <= Date.now()) {
      await db.from('inscripciones_evento').update({ estado: 'cancelada' }).eq('id', registration.id)
      return json({ error: 'La retencion del cupo ya vencio.' }, 410)
    }

    const [{ data: participant }, { data: modality }, { data: event }, { data: business }, { data: existingPayment }] = await Promise.all([
      db.from('participantes').select('*').eq('id', registration.participante_id).maybeSingle(),
      db.from('modalidades_evento').select('nombre').eq('id', registration.modalidad_evento_id).maybeSingle(),
      db.from('eventos').select('nombre, slug').eq('id', registration.evento_id).maybeSingle(),
      db.from('negocios').select('nombre, slug, provider_account_id').eq('id', registration.negocio_id).maybeSingle(),
      db.from('pagos').select('*').eq('inscripcion_evento_id', registration.id).eq('estado', 'pending').order('creado_en', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (!participant || !event || !business) return json({ error: 'La inscripcion no tiene toda la informacion requerida.' }, 409)
    if (existingPayment?.provider_checkout_id) return json(checkoutResponse(existingPayment, registration, event, business, modality?.nombre), 200)

    const providerInvoice = `${reference}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
    let payment = existingPayment
    if (payment) {
      const { data, error: paymentError } = await db.from('pagos').update({
        provider_payload: { ...objectValue(payment.provider_payload), checkout: 'pending', providerInvoice },
      }).eq('id', payment.id).select('*').single()
      if (paymentError) throw paymentError
      payment = data
    } else {
      const { data, error: paymentError } = await db.from('pagos').insert({
        negocio_id: registration.negocio_id,
        inscripcion_evento_id: registration.id,
        tipo_pago: 'evento', estado: 'pending', moneda: registration.moneda_codigo,
        monto_base_minor: registration.precio_base_minor - registration.descuento_minor,
        monto_total_minor: registration.total_minor,
        comision_plataforma_minor: registration.tarifa_plataforma_minor,
        cargo_pasarela_minor: registration.cargo_pasarela_minor,
        neto_negocio_minor: registration.precio_base_minor - registration.descuento_minor,
        payment_provider: 'epayco', provider_reference: reference,
        provider_account_id: business.provider_account_id ?? null,
        provider_payload: { checkout: 'pending', providerInvoice },
      }).select('*').single()
      if (paymentError) throw paymentError
      payment = data
    }
    if (!payment) throw new Error('No se pudo preparar el pago del evento.')

    const session = await createEpaycoSession({
      amountMinor: payment.monto_total_minor, currency: payment.moneda, reference,
      providerInvoice, customerName: `${participant.nombres} ${participant.apellidos}`,
      customerPhone: participant.telefono_e164, customerEmail: participant.email,
      customerDocumentType: participant.tipo_documento, customerDocument: participant.numero_documento,
      businessName: business.nombre, description: `${event.nombre} - ${modality?.nombre ?? 'Inscripcion'}`,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
      responseUrl: `${appPublicUrl()}/eventos/inscripciones/${reference}/resultado`,
      confirmationUrl: `${supabaseUrl}/functions/v1/epayco-webhook`,
    })
    const { data: updatedPayment, error: updateError } = await db.from('pagos').update({
      provider_checkout_id: session.sessionId, provider_payment_id: session.sessionId,
      provider_payload: { checkout: 'created', providerInvoice, sessionId: session.sessionId, test: Deno.env.get('EPAYCO_ENV') !== 'production' },
    }).eq('id', payment.id).select('*').single()
    if (updateError) throw updateError
    return json(checkoutResponse(updatedPayment, registration, event, business, modality?.nombre), 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No se pudo iniciar el pago del evento.' }, 500)
  }
})

async function createOrderCheckout(request: Request, db: ReturnType<typeof createClient>, supabaseUrl: string, reference: string) {
  const { data: order, error } = await db.from('ordenes_evento').select('*').eq('referencia_publica', reference).maybeSingle()
  if (error) throw error
  if (!order) return json({ error: 'Orden de evento no encontrada.' }, 404)
  if (order.estado !== 'pending') return json({ error: 'La orden ya no esta pendiente de pago.' }, 409)
  if (new Date(order.expira_en).getTime() <= Date.now()) {
    await db.from('ordenes_evento').update({ estado: 'canceled' }).eq('id', order.id)
    return json({ error: 'La retencion de los cupos ya vencio.' }, 410)
  }

  const { data: registrations, error: registrationsError } = await db.from('inscripciones_evento')
    .select('participante_id, modalidad_evento_id').eq('orden_evento_id', order.id).order('created_at').limit(1)
  if (registrationsError) throw registrationsError
  const firstRegistration = registrations?.[0]
  if (!firstRegistration) return json({ error: 'La orden no tiene participantes.' }, 409)

  const [{ data: participant }, { data: modality }, { data: event }, { data: business }, { data: existingPayment }] = await Promise.all([
    db.from('participantes').select('*').eq('id', firstRegistration.participante_id).maybeSingle(),
    db.from('modalidades_evento').select('nombre').eq('id', firstRegistration.modalidad_evento_id).maybeSingle(),
    db.from('eventos').select('nombre, slug').eq('id', order.evento_id).maybeSingle(),
    db.from('negocios').select('nombre, slug, provider_account_id').eq('id', order.negocio_id).maybeSingle(),
    db.from('pagos').select('*').eq('orden_evento_id', order.id).eq('estado', 'pending').order('creado_en', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (!participant || !event || !business) return json({ error: 'La orden no tiene toda la informacion requerida.' }, 409)
  if (existingPayment?.provider_checkout_id) return json(orderCheckoutResponse(existingPayment, order, event, business, modality?.nombre), 200)

  const providerInvoice = `${reference}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
  let payment = existingPayment
  if (payment) {
    const { data, error: paymentError } = await db.from('pagos').update({ provider_payload: { ...objectValue(payment.provider_payload), checkout: 'pending', providerInvoice } }).eq('id', payment.id).select('*').single()
    if (paymentError) throw paymentError
    payment = data
  } else {
    const { data, error: paymentError } = await db.from('pagos').insert({
      negocio_id: order.negocio_id, orden_evento_id: order.id, tipo_pago: 'evento', estado: 'pending',
      moneda: order.moneda_codigo, monto_base_minor: order.monto_base_minor,
      monto_total_minor: order.total_minor, comision_plataforma_minor: order.comision_plataforma_minor,
      cargo_pasarela_minor: order.cargo_pasarela_minor, neto_negocio_minor: order.monto_base_minor,
      payment_provider: 'epayco', provider_reference: reference,
      provider_account_id: business.provider_account_id ?? null,
      provider_payload: { checkout: 'pending', providerInvoice },
    }).select('*').single()
    if (paymentError) throw paymentError
    payment = data
  }
  if (!payment) throw new Error('No se pudo preparar el pago de la orden.')

  const session = await createEpaycoSession({
    amountMinor: payment.monto_total_minor, currency: payment.moneda, reference, providerInvoice,
    customerName: order.comprador_nombre, customerPhone: order.comprador_telefono_e164,
    customerEmail: order.comprador_email, customerDocumentType: participant.tipo_documento,
    customerDocument: participant.numero_documento, businessName: business.nombre,
    description: `${event.nombre} - ${order.cantidad} ${order.cantidad === 1 ? 'cupo' : 'cupos'}`,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1',
    responseUrl: `${appPublicUrl()}/eventos/inscripciones/${reference}/resultado`,
    confirmationUrl: `${supabaseUrl}/functions/v1/epayco-webhook`,
  })
  const { data: updatedPayment, error: updateError } = await db.from('pagos').update({
    provider_checkout_id: session.sessionId, provider_payment_id: session.sessionId,
    provider_payload: { checkout: 'created', providerInvoice, sessionId: session.sessionId, test: Deno.env.get('EPAYCO_ENV') !== 'production' },
  }).eq('id', payment.id).select('*').single()
  if (updateError) throw updateError
  return json(orderCheckoutResponse(updatedPayment, order, event, business, modality?.nombre), 200)
}

function orderCheckoutResponse(payment: Record<string, unknown>, order: Record<string, unknown>, event: Record<string, unknown>, business: Record<string, unknown>, modalityName?: string) {
  return { reference: order.referencia_publica, sessionId: payment.provider_checkout_id, test: Deno.env.get('EPAYCO_ENV') !== 'production', totalMinor: payment.monto_total_minor, currency: payment.moneda, eventName: event.nombre, eventSlug: event.slug, businessSlug: business.slug, businessName: business.nombre, modalityName: modalityName ?? 'Inscripcion', quantity: order.cantidad }
}

function checkoutResponse(payment: Record<string, unknown>, registration: Record<string, unknown>, event: Record<string, unknown>, business: Record<string, unknown>, modalityName?: string) {
  return { reference: registration.referencia_publica, sessionId: payment.provider_checkout_id, test: Deno.env.get('EPAYCO_ENV') !== 'production', totalMinor: payment.monto_total_minor, currency: payment.moneda, eventName: event.nombre, eventSlug: event.slug, businessSlug: business.slug, businessName: business.nombre, modalityName: modalityName ?? 'Inscripcion' }
}

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

async function createEpaycoSession(input: { amountMinor: number; currency: string; reference: string; providerInvoice: string; customerName: string; customerPhone: string; customerEmail: string; customerDocumentType: string; customerDocument: string; businessName: string; description: string; ip: string; responseUrl: string; confirmationUrl: string }) {
  const auth = btoa(`${requiredEnv('EPAYCO_PUBLIC_KEY')}:${requiredEnv('EPAYCO_PRIVATE_KEY')}`)
  const login = await fetch('https://apify.epayco.co/login', { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } })
  const loginBody = await login.json().catch(() => null)
  if (!login.ok || !loginBody?.token) throw new Error('ePayco no entrego token de autenticacion.')
  const session = await fetch('https://apify.epayco.co/payment/session/create', {
    method: 'POST', headers: { Authorization: `Bearer ${loginBody.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkout_version: '2', name: input.businessName, currency: input.currency, amount: amountForProvider(input.amountMinor, input.currency), taxBase: 0, tax: 0, taxIco: 0, description: input.description, lang: 'ES', country: 'CO', test: Deno.env.get('EPAYCO_ENV') !== 'production', ip: input.ip, invoice: input.providerInvoice, response: input.responseUrl, forceResponse: true, confirmation: input.confirmationUrl, method: 'GET', extras: { extra1: input.reference, extra2: 'rapicancha', extra3: 'evento' }, billing: { email: input.customerEmail, name: input.customerName, address: 'No reportada', typeDoc: input.customerDocumentType, numberDoc: input.customerDocument, mobilePhone: input.customerPhone } }),
  })
  const sessionBody = await session.json().catch(() => null)
  if (!session.ok || !sessionBody?.data?.sessionId) throw new Error(sessionBody?.textResponse ?? 'ePayco no pudo crear la sesion.')
  return { sessionId: sessionBody.data.sessionId as string }
}

function amountForProvider(value: number, currency: string) { return ['COP', 'CLP', 'PYG'].includes(currency) ? value : value / 100 }
function appPublicUrl() { return Deno.env.get('APP_PUBLIC_URL') ?? 'http://127.0.0.1:5173' }
function requiredEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`${name} no esta configurado.`); return value }
function json(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
