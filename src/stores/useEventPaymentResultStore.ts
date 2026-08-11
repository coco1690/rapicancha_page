import { create } from 'zustand'
import { eventRepository, type EventPaymentStatus, type EventPaymentStatusResponse } from '../services/repositories/eventRepository'
import { clearPendingEventCheckout } from '../services/payments/pendingEventCheckout'

type State = {
  reference: string
  status: 'idle' | 'checking' | EventPaymentStatus
  registration: EventPaymentStatusResponse['registration'] | null
  loading: boolean
  error: string
  redirectSeconds: number
  load: (reference: string) => Promise<void>
  tickRedirect: () => void
}

const failure = (error: unknown) => error instanceof Error ? error.message : 'No se pudo consultar el pago de la inscripcion.'

export const useEventPaymentResultStore = create<State>((set, get) => ({
  reference: '', status: 'idle', registration: null, loading: false, error: '', redirectSeconds: 10,
  load: async (reference) => {
    const normalized = reference.trim().toUpperCase()
    if (!normalized || get().loading) return
    const isNew = get().reference !== normalized
    set({ reference: normalized, status: isNew ? 'checking' : get().status, registration: isNew ? null : get().registration, loading: true, error: '', redirectSeconds: isNew ? 10 : get().redirectSeconds })
    try {
      const result = await eventRepository.fetchEventPaymentStatus(normalized)
      if (result.status !== 'pending') clearPendingEventCheckout(normalized)
      set({ status: result.status, registration: result.registration, loading: false, redirectSeconds: result.status === 'paid' && get().status !== 'paid' ? 10 : get().redirectSeconds })
    } catch (error) { set({ loading: false, error: failure(error) }) }
  },
  tickRedirect: () => set((state) => ({ redirectSeconds: Math.max(0, state.redirectSeconds - 1) })),
}))
