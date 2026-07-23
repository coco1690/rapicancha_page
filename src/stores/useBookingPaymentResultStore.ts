import { create } from 'zustand'
import { clearPendingCheckout } from '../services/payments/pendingCheckout'
import { checkoutRepository, type BookingPaymentStatus, type BookingPaymentStatusResponse } from '../services/repositories/checkoutRepository'

type State = {
  reference: string
  status: 'idle' | 'checking' | BookingPaymentStatus
  reservation: BookingPaymentStatusResponse['reservation'] | null
  loading: boolean
  error: string
  redirectSeconds: number
  load: (reference: string) => Promise<void>
  resolveProviderReference: (providerReference: string) => Promise<string | null>
  tickRedirect: () => void
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo consultar el estado de la reserva.'

export const useBookingPaymentResultStore = create<State>((set, get) => ({
  reference: '',
  status: 'idle',
  reservation: null,
  loading: false,
  error: '',
  redirectSeconds: 8,
  load: async (reference) => {
    const normalizedReference = reference.trim().toUpperCase()
    const current = get()
    if (!normalizedReference || current.loading) return
    const isNewReference = current.reference !== normalizedReference
    set({
      reference: normalizedReference,
      status: isNewReference ? 'checking' : current.status,
      reservation: isNewReference ? null : current.reservation,
      loading: true,
      error: '',
      redirectSeconds: isNewReference ? 8 : current.redirectSeconds,
    })
    try {
      const result = await checkoutRepository.fetchBookingPaymentStatus(normalizedReference)
      if (result.status === 'confirmed') clearPendingCheckout(normalizedReference)
      set({
        status: result.status,
        reservation: result.reservation,
        loading: false,
        redirectSeconds: result.status === 'confirmed' && current.status !== 'confirmed' ? 8 : get().redirectSeconds,
      })
    } catch (error) {
      set({ loading: false, error: errorMessage(error) })
    }
  },
  resolveProviderReference: async (providerReference) => {
    const normalizedProviderReference = providerReference.trim()
    if (!normalizedProviderReference || get().loading) return null
    set({ status: 'checking', loading: true, error: '' })
    try {
      const result = await checkoutRepository.fetchBookingPaymentStatusByProviderReference(normalizedProviderReference)
      if (result.status === 'confirmed') clearPendingCheckout(result.reference)
      set({
        reference: result.reference,
        status: result.status,
        reservation: result.reservation,
        loading: false,
        redirectSeconds: 8,
      })
      return result.reference
    } catch (error) {
      set({ loading: false, error: errorMessage(error) })
      return null
    }
  },
  tickRedirect: () => set((state) => ({ redirectSeconds: Math.max(0, state.redirectSeconds - 1) })),
}))
