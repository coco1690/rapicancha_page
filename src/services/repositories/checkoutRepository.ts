import { supabase } from '../supabase/client'
import type { Pais } from '../supabase/tables'

export type CreateBookingCheckoutInput = {
  courtId: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerPhoneCountryCode: string
  customerEmail: string
  customerDocumentType: string
  customerDocument: string
  acceptsMarketing: boolean
  acceptsWhatsApp: boolean
  acceptsTerms: boolean
  termsVersion: string
  returnTo: string
}

export type CreateBookingCheckoutResponse = {
  reservationReference: string
  paymentId: string
  provider: 'epayco'
  sessionId: string
  test: boolean
  courtName?: string
  priceMinor?: number
  platformFeeMinor?: number
  processingFeeMinor?: number
  totalMinor?: number
  currency?: string
}

export type PaymentQuote = {
  precio_base_minor: number
  comision_plataforma_minor: number
  subtotal_minor: number
  cargo_pasarela_minor: number
  total_minor: number
  tasa_plataforma: number
  tasa_pasarela: number
  cargo_fijo_pasarela_minor: number
  impuesto_pasarela: number
}

type ReconcilePaymentResponse = { ok?: boolean; confirmed?: boolean; status?: 'paid' | 'pending' | 'failed' | 'refunded'; error?: string }
export type BookingPaymentStatus = 'confirmed' | 'pending' | 'failed' | 'refunded'
export type BookingPaymentStatusResponse = {
  ok: boolean
  status: BookingPaymentStatus
  reference: string
  reservation: {
    date: string
    startTime: string
    endTime: string
    priceMinor: number
    currency: string
    courtName: string
    businessName: string
    businessSlug: string | null
    businessLogoUrl: string | null
  }
}

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

export const checkoutRepository = {
  quotePayment: async (paymentType: 'reserva' | 'evento' | 'torneo' | 'suscripcion', currency: string, baseMinor: number) => {
    const { data, error } = await client().rpc('cotizar_compra', {
      p_proveedor: 'epayco', p_tipo_pago: paymentType, p_moneda_codigo: currency,
      p_precio_base_minor: baseMinor,
    })
    if (error) throw error
    const quote = data?.[0]
    if (!quote) throw new Error('No se pudo calcular el total del pago.')
    return quote
  },
  fetchPhoneCountries: async (): Promise<Pais[]> => {
    const { data, error } = await client().from('paises').select('*').eq('activo', true).not('indicativo_pais', 'is', null).order('nombre')
    if (error) throw error
    return data ?? []
  },
  createBookingCheckout: async (input: CreateBookingCheckoutInput) => {
    const { data, error } = await client().functions.invoke<CreateBookingCheckoutResponse | { error?: string }>('create-booking-checkout', { body: input })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data && 'error' in data && data.error) throw new Error(data.error)
    const checkout = data as CreateBookingCheckoutResponse | null
    if (!checkout?.sessionId) throw new Error('No se recibio sesion de ePayco.')
    return checkout
  },
  cancelBookingCheckout: async (reference: string) => {
    const { data, error } = await client().functions.invoke<{ ok?: boolean; error?: string }>('cancel-booking-checkout', { body: { reference } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data?.error) throw new Error(data.error)
    return data
  },
  reconcileEpaycoPayment: async (reference: string, providerResponse: unknown) => {
    const { data, error } = await client().functions.invoke<ReconcilePaymentResponse>('reconcile-epayco-payment', { body: { reference, providerResponse } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data?.error) throw new Error(data.error)
    return data
  },
  fetchBookingPaymentStatus: async (reference: string) => {
    const { data, error } = await client().functions.invoke<BookingPaymentStatusResponse | { error?: string }>('booking-payment-status', { body: { reference } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data && 'error' in data && data.error) throw new Error(data.error)
    const result = data as BookingPaymentStatusResponse | null
    if (!result?.reference || !result.reservation) throw new Error('No se recibio el estado de la reserva.')
    return result
  },
  fetchBookingPaymentStatusByProviderReference: async (providerReference: string) => {
    const { data, error } = await client().functions.invoke<BookingPaymentStatusResponse | { error?: string }>('booking-payment-status', { body: { providerReference } })
    if (error) throw new Error(await functionErrorMessage(error))
    if (data && 'error' in data && data.error) throw new Error(data.error)
    const result = data as BookingPaymentStatusResponse | null
    if (!result?.reference || !result.reservation) throw new Error('No se encontro la reserva asociada al pago.')
    return result
  },
}

async function functionErrorMessage(error: unknown) {
  const context = typeof error === 'object' && error && 'context' in error ? (error as { context?: unknown }).context : null
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null) as { error?: string } | null
    if (body?.error) return body.error
  }
  return error instanceof Error ? error.message : 'No se pudo contactar la funcion de checkout.'
}
