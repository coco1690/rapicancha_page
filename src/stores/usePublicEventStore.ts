import { create } from 'zustand'
import { eventRepository, type EventCheckout, type EventRegistrationReceipt } from '../services/repositories/eventRepository'
import { openEpaycoCheckout } from '../services/payments/epaycoCheckout'
import { readPendingEventCheckout, savePendingEventCheckout } from '../services/payments/pendingEventCheckout'
import type { CategoriaEvento, Ciudad, Deporte, Evento, ModalidadEvento, Pais, PublicBusiness } from '../services/supabase/tables'
import { toE164 } from '../shared/lib/phone'
import type { PaymentQuote } from '../services/repositories/checkoutRepository'

type PublicEventData = { business: PublicBusiness; event: Evento; modalities: ModalidadEvento[]; categories: CategoriaEvento[]; sport: Deporte | null; city: Ciudad | null; paymentQuotes: Record<string, PaymentQuote> }
export type EventParticipantForm = {
  categoryId: string; firstName: string; lastName: string; documentType: string; documentNumber: string
  birthDate: string; gender: string; email: string; phoneCountryCode: string; phone: string
  emergencyName: string; emergencyPhoneCountryCode: string; emergencyPhone: string; shirtSize: string; declaredWeight: string
  acceptsEmailMarketing: boolean; acceptsWhatsAppMarketing: boolean
}
export type EventRegistrationForm = EventParticipantForm & {
  modalityId: string; quantity: number; additionalParticipants: EventParticipantForm[]
  acceptsTerms: boolean; acceptsPrivacy: boolean
}

const emptyParticipant = (): EventParticipantForm => ({ categoryId: '', firstName: '', lastName: '', documentType: 'CC', documentNumber: '', birthDate: '', gender: '', email: '', phoneCountryCode: 'CO', phone: '', emergencyName: '', emergencyPhoneCountryCode: 'CO', emergencyPhone: '', shirtSize: '', declaredWeight: '', acceptsEmailMarketing: false, acceptsWhatsAppMarketing: false })
const emptyForm = (): EventRegistrationForm => ({ ...emptyParticipant(), modalityId: '', quantity: 1, additionalParticipants: [], acceptsTerms: false, acceptsPrivacy: false })
const failure = (error: unknown) => (error as { message?: string })?.message ?? 'No se pudo completar la inscripción.'

type State = {
  data: PublicEventData | null; countries: Pais[]; form: EventRegistrationForm; selectedModality: ModalidadEvento | null
  groupQuote: PaymentQuote | null; open: boolean; loading: boolean; submitting: boolean; openingPayment: boolean
  error: string; receipt: EventRegistrationReceipt | null; checkout: EventCheckout | null
  load: (businessSlug: string, eventSlug: string) => Promise<void>; openRegistration: (modality: ModalidadEvento) => void
  closeRegistration: () => void; reopenPendingPayment: () => void
  setField: <K extends keyof EventRegistrationForm>(field: K, value: EventRegistrationForm[K]) => void
  setQuantity: (quantity: number) => Promise<void>
  setAdditionalField: <K extends keyof EventParticipantForm>(index: number, field: K, value: EventParticipantForm[K]) => void
  submit: () => Promise<void>; continuePayment: () => Promise<void>; clear: () => void
}

async function openPayment(checkout: EventCheckout, setError: (message: string) => void) {
  await openEpaycoCheckout({ sessionId: checkout.sessionId, test: checkout.test,
    onResponse: (providerResponse) => { void eventRepository.reconcileEventPayment(checkout.reference, providerResponse).finally(() => window.location.assign(`/eventos/inscripciones/${checkout.reference}/resultado`)) },
    onClosed: () => undefined, onError: setError })
}

function participantPayload(participant: EventParticipantForm, countries: Pais[]) {
  const phone = toE164(participant.phoneCountryCode, participant.phone, countries)
  const emergencyPhone = toE164(participant.emergencyPhoneCountryCode, participant.emergencyPhone, countries)
  if (!participant.firstName.trim() || !participant.lastName.trim() || !participant.documentNumber.trim() || !participant.birthDate || !participant.email.trim() || !participant.emergencyName.trim()) throw new Error('Completa todos los campos obligatorios de cada participante.')
  if (!phone || !emergencyPhone) throw new Error('Verifica los teléfonos y sus indicativos de país.')
  return { categoria_id: participant.categoryId, nombres: participant.firstName.trim(), apellidos: participant.lastName.trim(), tipo_documento: participant.documentType, numero_documento: participant.documentNumber.trim(), fecha_nacimiento: participant.birthDate, genero: participant.gender, email: participant.email.trim(), telefono_e164: phone, contacto_emergencia_nombre: participant.emergencyName.trim(), contacto_emergencia_telefono_e164: emergencyPhone, talla_camiseta: participant.shirtSize, peso_declarado: participant.declaredWeight ? Number(participant.declaredWeight) : 0, acepta_marketing_email: participant.acceptsEmailMarketing, acepta_marketing_whatsapp: participant.acceptsWhatsAppMarketing }
}

export const usePublicEventStore = create<State>((set, get) => ({
  data: null, countries: [], form: emptyForm(), selectedModality: null, groupQuote: null, open: false, loading: false, submitting: false, openingPayment: false, error: '', receipt: null, checkout: null,
  load: async (businessSlug, eventSlug) => {
    set({ loading: true, error: '', receipt: null })
    try {
      const [data, countries] = await Promise.all([eventRepository.fetchPublicEvent(businessSlug, eventSlug), eventRepository.fetchPhoneCountries()])
      const pending = data ? readPendingEventCheckout(businessSlug, eventSlug) : null
      const selectedModality = pending ? data?.modalities.find((item) => item.id === pending.modalityId) ?? null : null
      set({ data, countries, loading: false, error: data ? '' : 'Evento no encontrado.', receipt: pending?.receipt ?? null, checkout: pending?.checkout ?? null, selectedModality, open: Boolean(pending && selectedModality), groupQuote: selectedModality && data ? data.paymentQuotes[selectedModality.id] ?? null : null })
    } catch (error) { set({ loading: false, error: failure(error) }) }
  },
  openRegistration: (selectedModality) => set((state) => ({ selectedModality, form: { ...emptyForm(), modalityId: selectedModality.id }, groupQuote: state.data?.paymentQuotes[selectedModality.id] ?? null, open: true, error: '', receipt: null, checkout: null })),
  closeRegistration: () => set((state) => state.receipt ? { open: false, error: '' } : { open: false, error: '', receipt: null, checkout: null }),
  reopenPendingPayment: () => set((state) => ({ open: Boolean(state.receipt && state.selectedModality), error: '' })),
  setField: (field, value) => set((state) => ({ form: { ...state.form, [field]: value } })),
  setQuantity: async (quantity) => {
    const safeQuantity = Math.max(1, Math.min(10, Math.trunc(quantity || 1)))
    const state = get()
    const additionalParticipants = Array.from({ length: safeQuantity - 1 }, (_, index) => state.form.additionalParticipants[index] ?? emptyParticipant())
    set({ form: { ...state.form, quantity: safeQuantity, additionalParticipants }, error: '' })
    if (!state.selectedModality) return
    try {
      const quote = await eventRepository.quoteEventOrder(state.selectedModality.moneda_codigo, state.selectedModality.precio_base_minor * safeQuantity)
      if (get().form.quantity === safeQuantity) set({ groupQuote: quote })
    } catch (error) { set({ error: failure(error) }) }
  },
  setAdditionalField: (index, field, value) => set((state) => ({ form: { ...state.form, additionalParticipants: state.form.additionalParticipants.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) } })),
  submit: async () => {
    const state = get(), form = state.form
    if (!form.modalityId) return set({ error: 'Selecciona una modalidad.' })
    if (!form.acceptsTerms || !form.acceptsPrivacy) return set({ error: 'Debes aceptar los términos y el tratamiento de datos.' })
    set({ submitting: true, error: '' })
    try {
      const forms = [{ ...form }, ...form.additionalParticipants]
      if (state.data?.event.solicita_talla_camiseta && forms.some((item) => !item.shirtSize)) throw new Error('Selecciona la talla de camiseta de cada participante.')
      const participants = forms.map((item) => participantPayload(item, state.countries))
      const buyerPhone = participants[0].telefono_e164
      const receipt = await eventRepository.createPublicRegistration({ p_modalidad_evento_id: form.modalityId, p_participantes: participants, p_comprador_nombre: `${form.firstName.trim()} ${form.lastName.trim()}`, p_comprador_email: form.email.trim(), p_comprador_telefono_e164: buyerPhone, p_acepta_terminos: form.acceptsTerms, p_acepta_privacidad: form.acceptsPrivacy })
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
  clear: () => set({ data: null, form: emptyForm(), selectedModality: null, groupQuote: null, open: false, error: '', receipt: null, checkout: null }),
}))
