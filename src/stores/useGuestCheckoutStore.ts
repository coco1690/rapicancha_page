import { create } from 'zustand'
import { checkoutRepository } from '../services/repositories/checkoutRepository'
import { openEpaycoCheckout } from '../services/payments/epaycoCheckout'
import { bookingHoldMs, clearPendingCheckout, findPendingCheckoutByReference, findPendingCheckoutForSlot, pendingCheckoutTimeLeftMs, savePendingCheckout } from '../services/payments/pendingCheckout'

type CheckoutForm = {
  customerName: string
  customerPhone: string
  customerEmail: string
  customerDocumentType: string
  customerDocument: string
  acceptsMarketing: boolean
}

type CheckoutContext = {
  courtId: string
  date: string
  time: string
  returnTo: string
  courtName: string
  priceMinor: number
  currency: string
}

type GuestCheckoutStore = {
  form: CheckoutForm
  context: CheckoutContext
  submitting: boolean
  error: string
  message: string
  reference: string
  holdSecondsLeft: number
  hydrate: (context: Partial<CheckoutContext>) => void
  hydrateReference: (reference: string) => void
  setField: <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => void
  tickHold: () => void
  submit: () => Promise<void>
  cancel: () => Promise<string>
}

const emptyForm: CheckoutForm = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerDocumentType: 'CC',
  customerDocument: '',
  acceptsMarketing: false,
}

const emptyContext: CheckoutContext = {
  courtId: '',
  date: '',
  time: '',
  returnTo: '/',
  courtName: 'Cancha',
  priceMinor: 0,
  currency: 'COP',
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo iniciar el pago.'

export const useGuestCheckoutStore = create<GuestCheckoutStore>((set, get) => ({
  form: emptyForm,
  context: emptyContext,
  submitting: false,
  error: '',
  message: '',
  reference: '',
  holdSecondsLeft: Math.round(bookingHoldMs / 1000),
  hydrate: (context) => set((state) => {
    const nextContext = { ...state.context, ...context }
    const pending = nextContext.courtId && nextContext.date && nextContext.time ? findPendingCheckoutForSlot(nextContext.courtId, nextContext.date, nextContext.time) : null
    return {
      context: pending ? contextFromPending(pending, nextContext) : nextContext,
      form: pending ? formFromPending(pending, state.form) : state.form,
      reference: pending?.reference ?? state.reference,
      holdSecondsLeft: holdSecondsFromPending(pending),
      error: '',
      message: pending ? 'Tienes un pago pendiente para este horario. Puedes continuarlo sin crear otra reserva.' : '',
    }
  }),
  hydrateReference: (reference) => {
    const pending = findPendingCheckoutByReference(reference)
    set((state) => ({ context: pending ? contextFromPending(pending, emptyContext) : emptyContext, form: pending ? formFromPending(pending, state.form) : state.form, reference, holdSecondsLeft: holdSecondsFromPending(pending), error: pending ? '' : 'No encontramos una sesion de pago pendiente en este navegador.', message: pending ? 'Puedes continuar el pago pendiente.' : '' }))
  },
  setField: (field, value) => set((state) => ({ form: { ...state.form, [field]: value } })),
  tickHold: () => {
    const state = get()
    const pending = state.reference ? findPendingCheckoutByReference(state.reference) : null
    if (!pending) {
      set({ holdSecondsLeft: Math.round(bookingHoldMs / 1000) })
      return
    }
    set({ holdSecondsLeft: holdSecondsFromPending(pending), reference: pendingCheckoutTimeLeftMs(pending.createdAt) > 0 ? pending.reference : '' })
  },
  submit: async () => {
    const state = get()
    set({ submitting: true, error: '', message: '' })
    try {
      const pending = state.reference ? findPendingCheckoutByReference(state.reference) : findPendingCheckoutForSlot(state.context.courtId, state.context.date, state.context.time)
      if (pending) {
        set({ context: contextFromPending(pending, state.context), form: formFromPending(pending, state.form), reference: pending.reference, holdSecondsLeft: holdSecondsFromPending(pending), message: 'Reabriendo ePayco...' })
        await openEpaycoCheckout({
          sessionId: pending.sessionId,
          test: pending.test,
          onClosed: () => set({ submitting: false, message: 'Checkout cerrado. Puedes volver y continuar el pago mientras el horario este retenido.' }),
          onError: (message) => set({ submitting: false, error: message }),
        })
        return
      }
      if (!state.context.courtId || !state.context.date || !state.context.time) return set({ submitting: false, error: 'La reserva no tiene cancha, fecha u hora valida.' })
      if (state.form.customerName.trim().length < 3) return set({ submitting: false, error: 'Ingresa tu nombre completo.' })
      if (state.form.customerPhone.trim().length < 7) return set({ submitting: false, error: 'Ingresa un telefono valido.' })
      if (state.form.customerDocument.trim().length < 5) return set({ submitting: false, error: 'Ingresa tu documento de identidad.' })

      const checkout = await checkoutRepository.createBookingCheckout({
        courtId: state.context.courtId,
        date: state.context.date,
        time: state.context.time,
        customerName: state.form.customerName.trim(),
        customerPhone: state.form.customerPhone.trim(),
        customerEmail: state.form.customerEmail.trim(),
        customerDocumentType: state.form.customerDocumentType,
        customerDocument: state.form.customerDocument.trim(),
        acceptsMarketing: state.form.acceptsMarketing,
        returnTo: state.context.returnTo,
      })
      const pendingCreatedAt = Date.now()
      const nextContext = {
        ...state.context,
        courtName: checkout.courtName ?? state.context.courtName,
        priceMinor: checkout.priceMinor ?? state.context.priceMinor,
        currency: checkout.currency ?? state.context.currency,
      }
      savePendingCheckout({ reference: checkout.reservationReference, courtId: state.context.courtId, date: state.context.date, time: state.context.time, returnTo: state.context.returnTo, courtName: nextContext.courtName, priceMinor: nextContext.priceMinor, currency: nextContext.currency, sessionId: checkout.sessionId, test: checkout.test, createdAt: pendingCreatedAt, customerName: state.form.customerName.trim(), customerPhone: state.form.customerPhone.trim(), customerEmail: state.form.customerEmail.trim(), customerDocumentType: state.form.customerDocumentType, customerDocument: state.form.customerDocument.trim(), acceptsMarketing: state.form.acceptsMarketing })
      set({ context: nextContext, reference: checkout.reservationReference, holdSecondsLeft: holdSecondsFromCreatedAt(pendingCreatedAt), message: 'Abriendo ePayco...' })
      await openEpaycoCheckout({
        sessionId: checkout.sessionId,
        test: checkout.test,
        onClosed: () => set({ submitting: false, message: 'Checkout cerrado. Si pagaste, estamos confirmando tu reserva.' }),
        onError: (message) => set({ submitting: false, error: message }),
      })
    } catch (error) {
      set({ submitting: false, error: errorMessage(error) })
    }
  },
  cancel: async () => {
    const state = get()
    const reference = state.reference
    set({ submitting: true, error: '', message: '' })
    try {
      if (reference) {
        await checkoutRepository.cancelBookingCheckout(reference)
        clearPendingCheckout(reference)
      }
      set({ submitting: false, reference: '', context: emptyContext, form: emptyForm, holdSecondsLeft: Math.round(bookingHoldMs / 1000), message: '' })
      return state.context.returnTo || '/'
    } catch (error) {
      set({ submitting: false, error: errorMessage(error) })
      return state.context.returnTo || '/'
    }
  },
}))

function contextFromPending(pending: NonNullable<ReturnType<typeof findPendingCheckoutByReference>>, fallback: CheckoutContext): CheckoutContext {
  return {
    courtId: pending.courtId,
    date: pending.date,
    time: pending.time,
    returnTo: pending.returnTo || fallback.returnTo || '/',
    courtName: pending.courtName ?? fallback.courtName,
    priceMinor: pending.priceMinor ?? fallback.priceMinor,
    currency: pending.currency ?? fallback.currency,
  }
}

function holdSecondsFromPending(pending: ReturnType<typeof findPendingCheckoutByReference>) {
  return pending ? holdSecondsFromCreatedAt(pending.createdAt) : Math.round(bookingHoldMs / 1000)
}

function holdSecondsFromCreatedAt(createdAt: number) {
  return Math.ceil(pendingCheckoutTimeLeftMs(createdAt) / 1000)
}

function formFromPending(pending: ReturnType<typeof findPendingCheckoutByReference>, fallback: CheckoutForm): CheckoutForm {
  if (!pending) return fallback
  return {
    customerName: pending.customerName ?? fallback.customerName,
    customerPhone: pending.customerPhone ?? fallback.customerPhone,
    customerEmail: pending.customerEmail ?? fallback.customerEmail,
    customerDocumentType: pending.customerDocumentType ?? fallback.customerDocumentType,
    customerDocument: pending.customerDocument ?? fallback.customerDocument,
    acceptsMarketing: pending.acceptsMarketing ?? fallback.acceptsMarketing,
  }
}
