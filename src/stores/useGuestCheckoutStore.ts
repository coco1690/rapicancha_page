import { create } from 'zustand'
import { checkoutRepository } from '../services/repositories/checkoutRepository'
import { openEpaycoCheckout } from '../services/payments/epaycoCheckout'
import { bookingHoldMs, clearPendingCheckout, findPendingCheckoutByReference, findPendingCheckoutForSlot, pendingCheckoutTimeLeftMs, savePendingCheckout } from '../services/payments/pendingCheckout'
import type { BookingPaymentStatus } from '../services/repositories/checkoutRepository'
import type { Pais } from '../services/supabase/tables'
import { toE164 } from '../shared/lib/phone'
import { CURRENT_TERMS_VERSION } from '../shared/legal/terms'

type CheckoutForm = {
  customerName: string
  customerPhone: string
  customerPhoneCountryCode: string
  customerEmail: string
  customerDocumentType: string
  customerDocument: string
  acceptsMarketing: boolean
  acceptsWhatsApp: boolean
  acceptsTerms: boolean
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
  countries: Pais[]
  context: CheckoutContext
  submitting: boolean
  error: string
  message: string
  reference: string
  holdSecondsLeft: number
  hydrate: (context: Partial<CheckoutContext>) => void
  loadPhoneCountries: () => Promise<void>
  hydrateReference: (reference: string) => Promise<BookingPaymentStatus | 'missing'>
  setField: <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => void
  tickHold: () => void
  reconcilePayment: (reference: string, providerResponse: unknown) => Promise<void>
  finishProviderResponse: (reference: string, providerResponse: unknown) => Promise<void>
  submit: () => Promise<void>
  cancel: () => Promise<string>
}

const emptyForm: CheckoutForm = {
  customerName: '',
  customerPhone: '',
  customerPhoneCountryCode: 'CO',
  customerEmail: '',
  customerDocumentType: 'CC',
  customerDocument: '',
  acceptsMarketing: false,
  acceptsWhatsApp: false,
  acceptsTerms: false,
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
  countries: [],
  context: emptyContext,
  submitting: false,
  error: '',
  message: '',
  reference: '',
  holdSecondsLeft: Math.round(bookingHoldMs / 1000),
  loadPhoneCountries: async () => {
    try {
      const countries = await checkoutRepository.fetchPhoneCountries()
      set((state) => ({
        countries,
        form: {
          ...state.form,
          customerPhoneCountryCode: countries.some((country) => country.codigo_iso2 === state.form.customerPhoneCountryCode)
            ? state.form.customerPhoneCountryCode
            : countries[0]?.codigo_iso2 ?? 'CO',
        },
      }))
    } catch (error) {
      set({ error: errorMessage(error) })
    }
  },
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
  hydrateReference: async (reference) => {
    const pending = findPendingCheckoutByReference(reference)
    set({ submitting: true, error: '', message: '' })
    try {
      const result = await checkoutRepository.fetchBookingPaymentStatus(reference)
      if (result.status !== 'pending') {
        clearPendingCheckout(reference)
        set({
          context: pending ? contextFromPending(pending, emptyContext) : emptyContext,
          reference: '',
          holdSecondsLeft: 0,
          submitting: false,
          message: result.status === 'confirmed' ? 'Esta reserva ya fue pagada y confirmada.' : '',
          error: result.status === 'failed' ? 'Esta sesion de pago ya finalizo sin aprobacion.' : '',
        })
        return result.status
      }
      set((state) => ({
        context: pending ? contextFromPending(pending, emptyContext) : emptyContext,
        form: pending ? formFromPending(pending, state.form) : state.form,
        reference: pending?.reference ?? '',
        holdSecondsLeft: holdSecondsFromPending(pending),
        submitting: false,
        error: pending ? '' : 'No encontramos una sesion de pago pendiente en este navegador.',
        message: pending ? 'Puedes continuar el pago pendiente.' : '',
      }))
      return pending ? 'pending' : 'missing'
    } catch (error) {
      set({
        context: pending ? contextFromPending(pending, emptyContext) : emptyContext,
        reference: pending?.reference ?? '',
        holdSecondsLeft: holdSecondsFromPending(pending),
        submitting: false,
        error: pending ? '' : errorMessage(error),
        message: pending ? 'Puedes continuar el pago pendiente.' : '',
      })
      return pending ? 'pending' : 'missing'
    }
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
  reconcilePayment: async (reference, providerResponse) => {
    try {
      set({ submitting: true, error: '', message: 'Validando el pago aprobado con ePayco...' })
      const result = await checkoutRepository.reconcileEpaycoPayment(reference, providerResponse)
      if (result?.confirmed) {
        clearPendingCheckout(reference)
        set({ submitting: false, reference: '', holdSecondsLeft: 0, message: 'Pago aprobado. Tu reserva fue confirmada y el club ya fue notificado.' })
        return
      }
      if (result?.status === 'failed' || result?.status === 'refunded') {
        clearPendingCheckout(reference)
        set({ submitting: false, reference: '', error: result.status === 'refunded' ? 'ePayco reporto que la transaccion fue reversada.' : 'ePayco reporto que la transaccion no fue aprobada.', message: '' })
        return
      }
      set({ submitting: false, message: 'El pago aun esta pendiente de confirmacion en ePayco.' })
    } catch (error) {
      set({ submitting: false, error: errorMessage(error), message: '' })
    }
  },
  finishProviderResponse: async (reference, providerResponse) => {
    try {
      await get().reconcilePayment(reference, providerResponse)
    } finally {
      window.location.assign(`/checkout/${encodeURIComponent(reference)}/respuesta`)
    }
  },
  submit: async () => {
    const state = get()
    set({ submitting: true, error: '', message: '' })
    try {
      if (!state.form.acceptsTerms) return set({ submitting: false, error: 'Debes aceptar los terminos y condiciones para continuar.' })
      const pending = state.reference ? findPendingCheckoutByReference(state.reference) : findPendingCheckoutForSlot(state.context.courtId, state.context.date, state.context.time)
      if (pending) {
        set({ context: contextFromPending(pending, state.context), form: formFromPending(pending, state.form), reference: pending.reference, holdSecondsLeft: holdSecondsFromPending(pending), message: 'Reabriendo ePayco...' })
        await openEpaycoCheckout({
          sessionId: pending.sessionId,
          test: pending.test,
          onResponse: (providerResponse) => { void get().finishProviderResponse(pending.reference, providerResponse) },
          onClosed: () => { if (findPendingCheckoutByReference(pending.reference)) set({ submitting: false, message: 'Checkout cerrado. Puedes volver y continuar el pago mientras el horario este retenido.' }); else set({ submitting: false }) },
          onError: (message) => set({ submitting: false, error: message }),
        })
        return
      }
      if (!state.context.courtId || !state.context.date || !state.context.time) return set({ submitting: false, error: 'La reserva no tiene cancha, fecha u hora valida.' })
      if (state.form.customerName.trim().length < 3) return set({ submitting: false, error: 'Ingresa tu nombre completo.' })
      const customerPhoneE164 = toE164(state.form.customerPhoneCountryCode, state.form.customerPhone, state.countries)
      if (!customerPhoneE164) return set({ submitting: false, error: 'Ingresa un telefono valido con su indicativo de pais.' })
      if (state.form.customerDocument.trim().length < 5) return set({ submitting: false, error: 'Ingresa tu documento de identidad.' })

      const checkout = await checkoutRepository.createBookingCheckout({
        courtId: state.context.courtId,
        date: state.context.date,
        time: state.context.time,
        customerName: state.form.customerName.trim(),
        customerPhone: state.form.customerPhone.trim(),
        customerPhoneCountryCode: state.form.customerPhoneCountryCode,
        customerEmail: state.form.customerEmail.trim(),
        customerDocumentType: state.form.customerDocumentType,
        customerDocument: state.form.customerDocument.trim(),
        acceptsMarketing: state.form.acceptsMarketing,
        acceptsWhatsApp: state.form.acceptsWhatsApp,
        acceptsTerms: state.form.acceptsTerms,
        termsVersion: CURRENT_TERMS_VERSION,
        returnTo: state.context.returnTo,
      })
      const pendingCreatedAt = Date.now()
      const nextContext = {
        ...state.context,
        courtName: checkout.courtName ?? state.context.courtName,
        priceMinor: checkout.priceMinor ?? state.context.priceMinor,
        currency: checkout.currency ?? state.context.currency,
      }
      savePendingCheckout({ reference: checkout.reservationReference, courtId: state.context.courtId, date: state.context.date, time: state.context.time, returnTo: state.context.returnTo, courtName: nextContext.courtName, priceMinor: nextContext.priceMinor, currency: nextContext.currency, sessionId: checkout.sessionId, test: checkout.test, createdAt: pendingCreatedAt, customerName: state.form.customerName.trim(), customerPhone: state.form.customerPhone.trim(), customerPhoneCountryCode: state.form.customerPhoneCountryCode, customerEmail: state.form.customerEmail.trim(), acceptsMarketing: state.form.acceptsMarketing, acceptsWhatsApp: state.form.acceptsWhatsApp, acceptsTerms: state.form.acceptsTerms, termsVersion: CURRENT_TERMS_VERSION })
      set({ context: nextContext, reference: checkout.reservationReference, holdSecondsLeft: holdSecondsFromCreatedAt(pendingCreatedAt), message: 'Abriendo ePayco...' })
      await openEpaycoCheckout({
        sessionId: checkout.sessionId,
        test: checkout.test,
        onResponse: (providerResponse) => { void get().finishProviderResponse(checkout.reservationReference, providerResponse) },
        onClosed: () => { if (findPendingCheckoutByReference(checkout.reservationReference)) set({ submitting: false, message: 'Checkout cerrado. Si pagaste, estamos confirmando tu reserva.' }); else set({ submitting: false }) },
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
    customerPhoneCountryCode: pending.customerPhoneCountryCode ?? fallback.customerPhoneCountryCode,
    customerEmail: pending.customerEmail ?? fallback.customerEmail,
    customerDocumentType: fallback.customerDocumentType,
    customerDocument: '',
    acceptsMarketing: pending.acceptsMarketing ?? fallback.acceptsMarketing,
    acceptsWhatsApp: pending.acceptsWhatsApp ?? fallback.acceptsWhatsApp,
    acceptsTerms: pending.acceptsTerms === true && pending.termsVersion === CURRENT_TERMS_VERSION,
  }
}
