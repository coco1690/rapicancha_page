import { create } from 'zustand'
import { eventRepository, type EventCheckout, type EventRegistrationReceipt } from '../services/repositories/eventRepository'
import { openEpaycoCheckout } from '../services/payments/epaycoCheckout'
import { readPendingEventCheckout, savePendingEventCheckout } from '../services/payments/pendingEventCheckout'
import type { CategoriaEvento, Ciudad, Deporte, Evento, ModalidadEvento, Pais, PublicBusiness } from '../services/supabase/tables'
import { toE164 } from '../shared/lib/phone'
import type { PaymentQuote } from '../services/repositories/checkoutRepository'

type PublicEventData = { business: PublicBusiness; event: Evento; modalities: ModalidadEvento[]; categories: CategoriaEvento[]; sport: Deporte | null; city: Ciudad | null; paymentQuotes: Record<string, PaymentQuote> }
export type EventRegistrationForm = {
  modalityId: string; categoryId: string; firstName: string; lastName: string; documentType: string; documentNumber: string
  birthDate: string; gender: string; email: string; phoneCountryCode: string; phone: string
  emergencyName: string; emergencyPhoneCountryCode: string; emergencyPhone: string; shirtSize: string
  declaredWeight: string
  acceptsTerms: boolean; acceptsPrivacy: boolean
}
const emptyForm: EventRegistrationForm = { modalityId: '', categoryId: '', firstName: '', lastName: '', documentType: 'CC', documentNumber: '', birthDate: '', gender: '', email: '', phoneCountryCode: 'CO', phone: '', emergencyName: '', emergencyPhoneCountryCode: 'CO', emergencyPhone: '', shirtSize: '', declaredWeight: '', acceptsTerms: false, acceptsPrivacy: false }
const failure = (error: unknown) => (error as { message?: string })?.message ?? 'No se pudo completar la inscripción.'

type State = {
  data: PublicEventData | null; countries: Pais[]; form: EventRegistrationForm; selectedModality: ModalidadEvento | null
  open: boolean; loading: boolean; submitting: boolean; openingPayment: boolean; error: string; receipt: EventRegistrationReceipt | null; checkout: EventCheckout | null
  load: (businessSlug: string, eventSlug: string) => Promise<void>; openRegistration: (modality: ModalidadEvento) => void
  closeRegistration: () => void; reopenPendingPayment: () => void; setField: <K extends keyof EventRegistrationForm>(field: K, value: EventRegistrationForm[K]) => void
  submit: () => Promise<void>; continuePayment: () => Promise<void>; clear: () => void
}

async function openPayment(checkout: EventCheckout, setError: (message: string) => void) {
  await openEpaycoCheckout({
    sessionId: checkout.sessionId,
    test: checkout.test,
    onResponse: (providerResponse) => {
      void eventRepository.reconcileEventPayment(checkout.reference, providerResponse).finally(() => {
        window.location.assign(`/eventos/inscripciones/${checkout.reference}/resultado`)
      })
    },
    onClosed: () => undefined,
    onError: setError,
  })
}

export const usePublicEventStore = create<State>((set, get) => ({
  data: null, countries: [], form: emptyForm, selectedModality: null, open: false, loading: false, submitting: false, openingPayment: false, error: '', receipt: null, checkout: null,
  load: async (businessSlug, eventSlug) => {
    set({ loading: true, error: '', receipt: null })
    try {
      const [data, countries] = await Promise.all([eventRepository.fetchPublicEvent(businessSlug, eventSlug), eventRepository.fetchPhoneCountries()])
      const pending = data ? readPendingEventCheckout(businessSlug, eventSlug) : null
      const selectedModality = pending ? data?.modalities.find((item) => item.id === pending.modalityId) ?? null : null
      set({ data, countries, loading: false, error: data ? '' : 'Evento no encontrado.', receipt: pending?.receipt ?? null, checkout: pending?.checkout ?? null, selectedModality, open: Boolean(pending && selectedModality) })
    } catch (error) { set({ loading: false, error: failure(error) }) }
  },
  openRegistration: (selectedModality) => set({ selectedModality, form: { ...emptyForm, modalityId: selectedModality.id }, open: true, error: '', receipt: null, checkout: null }),
  closeRegistration: () => set((state) => state.receipt ? { open: false, error: '' } : { open: false, error: '', receipt: null, checkout: null }),
  reopenPendingPayment: () => set((state) => ({ open: Boolean(state.receipt && state.selectedModality), error: '' })),
  setField: (field, value) => set((state) => ({ form: { ...state.form, [field]: value, ...(field === 'modalityId' ? { categoryId: '' } : {}) } })),
  submit: async () => {
    const state = get(), form = state.form
    if (!form.modalityId || !form.firstName.trim() || !form.lastName.trim() || !form.documentNumber.trim() || !form.birthDate || !form.email.trim() || !form.emergencyName.trim()) return set({ error: 'Completa todos los campos obligatorios.' })
    if (state.data?.event.solicita_talla_camiseta && !form.shirtSize) return set({ error: 'Selecciona la talla de camiseta.' })
    if (!form.acceptsTerms || !form.acceptsPrivacy) return set({ error: 'Debes aceptar los términos y el tratamiento de datos.' })
    const phone = toE164(form.phoneCountryCode, form.phone, state.countries)
    const emergencyPhone = toE164(form.emergencyPhoneCountryCode, form.emergencyPhone, state.countries)
    if (!phone || !emergencyPhone) return set({ error: 'Verifica los teléfonos y sus indicativos de país.' })
    set({ submitting: true, error: '' })
    try {
      const receipt = await eventRepository.createPublicRegistration({ p_modalidad_evento_id: form.modalityId, p_categoria_evento_id: form.categoryId || '00000000-0000-0000-0000-000000000000', p_nombres: form.firstName.trim(), p_apellidos: form.lastName.trim(), p_tipo_documento: form.documentType, p_numero_documento: form.documentNumber.trim(), p_fecha_nacimiento: form.birthDate, p_genero: form.gender, p_email: form.email.trim(), p_telefono_e164: phone, p_contacto_emergencia_nombre: form.emergencyName.trim(), p_contacto_emergencia_telefono_e164: emergencyPhone, p_talla_camiseta: form.shirtSize, p_peso_declarado: form.declaredWeight ? Number(form.declaredWeight) : 0, p_acepta_terminos: form.acceptsTerms, p_acepta_privacidad: form.acceptsPrivacy })
      set({ receipt, submitting: false, openingPayment: true })
      if (state.data?.business.slug) savePendingEventCheckout({ businessSlug: state.data.business.slug, eventSlug: state.data.event.slug, modalityId: form.modalityId, receipt, checkout: null })
      const checkout = await eventRepository.createEventCheckout(receipt.referencia_publica)
      set({ checkout, openingPayment: false })
      if (state.data) savePendingEventCheckout({ businessSlug: checkout.businessSlug, eventSlug: state.data.event.slug, modalityId: form.modalityId, receipt, checkout })
      await openPayment(checkout, (message) => set({ error: message }))
    } catch (error) { set({ submitting: false, openingPayment: false, error: failure(error) }) }
  },
  continuePayment: async () => {
    const state = get()
    if (!state.receipt || state.openingPayment) return
    set({ openingPayment: true, error: '' })
    try {
      const checkout = state.checkout ?? await eventRepository.createEventCheckout(state.receipt.referencia_publica)
      set({ checkout, openingPayment: false })
      await openPayment(checkout, (message) => set({ error: message }))
    } catch (error) { set({ openingPayment: false, error: failure(error) }) }
  },
  clear: () => set({ data: null, form: emptyForm, selectedModality: null, open: false, error: '', receipt: null, checkout: null }),
}))
