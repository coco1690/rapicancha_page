import { supabase } from '../supabase/client'
import type { TableInsert, TableUpdate } from '../supabase/tables'
import type { Pais } from '../supabase/tables'
import type { PaymentQuote } from './checkoutRepository'

export type EventCheckout = {
  reference: string
  sessionId: string
  test: boolean
  totalMinor: number
  currency: string
  eventName: string
  eventSlug: string
  businessSlug: string
  businessName: string
  modalityName: string
}

export type EventRegistrationReceipt = {
  referencia_publica: string
  cantidad: number
  monto_base_minor: number
  tarifa_plataforma_minor: number
  cargo_pasarela_minor: number
  total_minor: number
  moneda_codigo: string
  expira_en: string
  inscripciones: Array<{ numero_inscripcion: string; referencia_publica: string; participante: string }>
}

export type EventPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type EventPaymentStatusResponse = {
  ok: boolean
  status: EventPaymentStatus
  reference: string
  registration: {
    number: string
    bib: string | null
    shirtSize: string | null
    totalMinor: number
    currency: string
    participantName: string
    eventName: string
    eventSlug: string
    eventStart: string
    timezone: string
    modalityName: string
    businessName: string
    businessSlug: string
    quantity?: number
    registrations?: Array<{ number: string; bib: string | null; shirtSize: string | null; participantName: string }>
  }
}

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

function ensure(error: { message: string } | null) {
  if (error) throw error
}

export const eventRepository = {
  fetchPublicEvent: async (businessSlug: string, eventSlug: string) => {
    const db = client()
    const businessResult = await db.from('negocios_publicos').select('*').eq('slug', businessSlug).maybeSingle()
    if (businessResult.error) throw businessResult.error
    if (!businessResult.data?.id) return null
    const eventResult = await db.from('eventos').select('*').eq('negocio_id', businessResult.data.id).eq('slug', eventSlug).eq('es_publico', true).in('estado', ['publicado', 'en_curso', 'finalizado']).maybeSingle()
    if (eventResult.error) throw eventResult.error
    if (!eventResult.data) return null
    const [modalities, categories, sport, city] = await Promise.all([
      db.from('modalidades_evento').select('*').eq('evento_id', eventResult.data.id).eq('activa', true).order('orden').order('nombre'),
      db.from('categorias_evento').select('*').eq('evento_id', eventResult.data.id).eq('activa', true).order('orden').order('nombre'),
      db.from('deportes').select('*').eq('id', eventResult.data.deporte_id).maybeSingle(),
      eventResult.data.ciudad_id ? db.from('ciudades').select('*').eq('id', eventResult.data.ciudad_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ])
    const error = modalities.error || categories.error || sport.error || city.error
    ensure(error)
    const modalityRows = modalities.data ?? []
    const quoteEntries = await Promise.all(modalityRows.map(async (modality) => {
      const quoteResult = await db.rpc('cotizar_compra', { p_proveedor: 'epayco', p_tipo_pago: 'evento', p_moneda_codigo: modality.moneda_codigo, p_precio_base_minor: modality.precio_base_minor })
      ensure(quoteResult.error)
      return [modality.id, quoteResult.data?.[0] as PaymentQuote] as const
    }))
    return { business: businessResult.data, event: eventResult.data, modalities: modalityRows, categories: categories.data ?? [], sport: sport.data, city: city.data, paymentQuotes: Object.fromEntries(quoteEntries) as Record<string, PaymentQuote> }
  },
  fetchPhoneCountries: async (): Promise<Pais[]> => {
    const result = await client().from('paises').select('*').eq('activo', true).not('indicativo_pais', 'is', null).order('nombre')
    ensure(result.error)
    return result.data ?? []
  },
  quoteEventOrder: async (currency: string, baseMinor: number) => {
    const result = await client().rpc('cotizar_compra', { p_proveedor: 'epayco', p_tipo_pago: 'evento', p_moneda_codigo: currency, p_precio_base_minor: baseMinor })
    ensure(result.error)
    const quote = result.data?.[0] as PaymentQuote | undefined
    if (!quote) throw new Error('No se pudo calcular el total de la orden.')
    return quote
  },
  createPublicRegistration: async (input: DatabaseRegistrationInput): Promise<EventRegistrationReceipt> => {
    const result = await client().rpc('crear_orden_evento_publica', input)
    ensure(result.error)
    const registration = result.data?.[0]
    if (!registration) throw new Error('No se pudo generar la inscripcion.')
    return { ...registration, inscripciones: Array.isArray(registration.inscripciones) ? registration.inscripciones as EventRegistrationReceipt['inscripciones'] : [] }
  },
  createEventCheckout: async (reference: string) => {
    const { data, error } = await client().functions.invoke<EventCheckout | { error?: string }>('create-event-checkout', { body: { reference } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data && 'error' in data && data.error) throw new Error(data.error)
    const checkout = data as EventCheckout | null
    if (!checkout?.sessionId) throw new Error('No se recibio la sesion de pago del evento.')
    return checkout
  },
  reconcileEventPayment: async (reference: string, providerResponse: unknown) => {
    const { data, error } = await client().functions.invoke<{ status?: EventPaymentStatus; error?: string }>('reconcile-epayco-payment', { body: { reference, providerResponse } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data?.error) throw new Error(data.error)
    return data
  },
  fetchEventPaymentStatus: async (reference: string) => {
    const { data, error } = await client().functions.invoke<EventPaymentStatusResponse | { error?: string }>('event-payment-status', { body: { reference } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data && 'error' in data && data.error) throw new Error(data.error)
    const result = data as EventPaymentStatusResponse | null
    if (!result?.reference || !result.registration) throw new Error('No se recibio el estado de la inscripcion.')
    return result
  },
  fetchWorkspace: async (businessId?: string) => {
    const db = client()
    let eventQuery = db.from('eventos').select('*').order('inicio_at', { ascending: false })
    let businessQuery = db.from('negocios').select('*').order('nombre')
    if (businessId) {
      eventQuery = eventQuery.eq('negocio_id', businessId)
      businessQuery = businessQuery.eq('id', businessId)
    }

    const [events, modalities, categories, registrations, businesses, sports, cities, plans] = await Promise.all([
      eventQuery,
      db.from('modalidades_evento').select('*').order('orden').order('nombre'),
      db.from('categorias_evento').select('*').order('orden').order('nombre'),
      db.from('inscripciones_evento').select('*, participantes(*), modalidades_evento(nombre), categorias_evento(nombre)').order('created_at', { ascending: false }),
      businessQuery,
      db.from('deportes').select('*').eq('activo', true).order('nombre'),
      db.from('ciudades').select('*').eq('activo', true).order('nombre'),
      db.from('planes').select('*').order('nombre'),
    ])
    const error = events.error || modalities.error || categories.error || registrations.error || businesses.error || sports.error || cities.error || plans.error
    ensure(error)
    const eventIds = new Set((events.data ?? []).map((event) => event.id))
    return {
      events: events.data ?? [],
      modalities: (modalities.data ?? []).filter((item) => eventIds.has(item.evento_id)),
      categories: (categories.data ?? []).filter((item) => eventIds.has(item.evento_id)),
      registrations: (registrations.data ?? []).filter((item) => eventIds.has(item.evento_id)),
      businesses: businesses.data ?? [],
      sports: sports.data ?? [],
      cities: cities.data ?? [],
      plans: plans.data ?? [],
    }
  },
  saveEvent: async (id: string | null, values: TableInsert<'eventos'> | TableUpdate<'eventos'>) => {
    const result = id
      ? await client().from('eventos').update(values).eq('id', id)
      : await client().from('eventos').insert(values as TableInsert<'eventos'>)
    ensure(result.error)
  },
  deleteEvent: async (id: string) => {
    const result = await client().from('eventos').delete().eq('id', id)
    ensure(result.error)
  },
  saveModality: async (id: string | null, values: TableInsert<'modalidades_evento'> | TableUpdate<'modalidades_evento'>) => {
    const result = id
      ? await client().from('modalidades_evento').update(values).eq('id', id)
      : await client().from('modalidades_evento').insert(values as TableInsert<'modalidades_evento'>)
    ensure(result.error)
  },
  deleteModality: async (id: string) => {
    const result = await client().from('modalidades_evento').delete().eq('id', id)
    ensure(result.error)
  },
  saveCategory: async (id: string | null, values: TableInsert<'categorias_evento'> | TableUpdate<'categorias_evento'>) => {
    const result = id
      ? await client().from('categorias_evento').update(values).eq('id', id)
      : await client().from('categorias_evento').insert(values as TableInsert<'categorias_evento'>)
    ensure(result.error)
  },
  deleteCategory: async (id: string) => {
    const result = await client().from('categorias_evento').delete().eq('id', id)
    ensure(result.error)
  },
  updateRegistration: async (id: string, values: TableUpdate<'inscripciones_evento'>) => {
    const result = await client().from('inscripciones_evento').update(values).eq('id', id)
    ensure(result.error)
  },
}

export type DatabaseRegistrationInput = {
  p_modalidad_evento_id: string
  p_participantes: Array<{
    categoria_id: string
    nombres: string
    apellidos: string
    tipo_documento: string
    numero_documento: string
    fecha_nacimiento: string
    genero: string
    email: string
    telefono_e164: string
    contacto_emergencia_nombre: string
    contacto_emergencia_telefono_e164: string
    talla_camiseta: string
    peso_declarado: number
  }>
  p_comprador_nombre: string
  p_comprador_email: string
  p_comprador_telefono_e164: string
  p_acepta_terminos: boolean
  p_acepta_privacidad: boolean
}

async function functionErrorMessage(error: unknown) {
  const context = typeof error === 'object' && error && 'context' in error ? (error as { context?: unknown }).context : null
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null) as { error?: string } | null
    if (body?.error) return body.error
  }
  return error instanceof Error ? error.message : 'No se pudo contactar la funcion de eventos.'
}
