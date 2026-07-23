import { supabase } from '../supabase/client'

export type CreateBookingCheckoutInput = {
  courtId: string
  date: string
  time: string
  customerName: string
  customerPhone: string
  customerEmail: string
  customerDocumentType: string
  customerDocument: string
  acceptsMarketing: boolean
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
  currency?: string
}

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

export const checkoutRepository = {
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
}

async function functionErrorMessage(error: unknown) {
  const context = typeof error === 'object' && error && 'context' in error ? (error as { context?: unknown }).context : null
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null) as { error?: string } | null
    if (body?.error) return body.error
  }
  return error instanceof Error ? error.message : 'No se pudo contactar la funcion de checkout.'
}
