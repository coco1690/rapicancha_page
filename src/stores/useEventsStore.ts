import { create } from 'zustand'
import { eventRepository } from '../services/repositories/eventRepository'
import type { CategoriaEvento, Ciudad, Deporte, Evento, EventoEstado, InscripcionEvento, ModalidadEvento, Negocio, Participante, Plan } from '../services/supabase/tables'
import { addDaysToDateKey, dateKeyInTimeZone, isoToZonedDateTimeInput, zonedDateTimeInputToIso } from '../shared/lib/date'
import { majorToMinor, minorToMajor } from '../shared/lib/money'

export type EventScope = 'business' | 'admin'
export type EventForm = {
  businessId: string; sportId: string; cityId: string; name: string; slug: string; description: string
  address: string; start: string; end: string; registrationsOpen: string; registrationsClose: string
  capacity: string; status: EventoEstado; isPublic: boolean; coverUrl: string; rulesUrl: string
  timezone: string; currency: string; requiresBib: boolean; bibStart: string; requestsShirtSize: boolean; shirtSizes: string
}
export type ModalityForm = {
  name: string; slug: string; description: string; distance: string; distanceUnit: string
  start: string; capacity: string; price: string; active: boolean
}
export type CategoryForm = {
  modalityId: string; name: string; gender: string; minimumAge: string; maximumAge: string
  minimumWeight: string; maximumWeight: string; level: string; active: boolean
}
export type EventRegistrationRow = InscripcionEvento & { participantes: Participante | null; modalidades_evento: { nombre: string } | null; categorias_evento: { nombre: string } | null }

const emptyEvent: EventForm = { businessId: '', sportId: '', cityId: '', name: '', slug: '', description: '', address: '', start: '', end: '', registrationsOpen: '', registrationsClose: '', capacity: '', status: 'borrador', isPublic: false, coverUrl: '', rulesUrl: '', timezone: 'America/Bogota', currency: 'COP', requiresBib: false, bibStart: '1', requestsShirtSize: false, shirtSizes: 'XS, S, M, L, XL, XXL' }
const emptyModality: ModalityForm = { name: '', slug: '', description: '', distance: '', distanceUnit: 'km', start: '', capacity: '', price: '0', active: true }
const emptyCategory: CategoryForm = { modalityId: '', name: '', gender: '', minimumAge: '', maximumAge: '', minimumWeight: '', maximumWeight: '', level: '', active: true }
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const failure = (error: unknown) => {
  const value = error as { code?: string; message?: string }
  if (value.code === '23505') return 'Ya existe un registro con ese nombre o identificador.'
  if (value.code === 'P0001') return value.message ?? 'El plan actual no permite esta operacion.'
  return value.message ?? (error instanceof Error ? error.message : 'No se pudo completar la operacion.')
}
const optionalNumber = (value: string) => value.trim() ? Number(value) : null

type EventsState = {
  scope: EventScope
  contextBusinessId: string | null
  events: Evento[]
  modalities: ModalidadEvento[]
  categories: CategoriaEvento[]
  registrations: EventRegistrationRow[]
  businesses: Negocio[]
  sports: Deporte[]
  cities: Ciudad[]
  plans: Plan[]
  search: string
  loading: boolean
  saving: boolean
  error: string
  message: string
  eventOpen: boolean
  editingEvent: Evento | null
  eventForm: EventForm
  modalityEvent: Evento | null
  editingModality: ModalidadEvento | null
  modalityForm: ModalityForm
  categoryEvent: Evento | null
  editingCategory: CategoriaEvento | null
  categoryForm: CategoryForm
  registrationEvent: Evento | null
  load: (scope: EventScope, businessId?: string) => Promise<void>
  setSearch: (value: string) => void
  clearFeedback: () => void
  openEventCreate: () => void
  openEventEdit: (event: Evento) => void
  closeEvent: () => void
  setEventField: <K extends keyof EventForm>(field: K, value: EventForm[K]) => void
  selectBusiness: (id: string) => void
  saveEvent: () => Promise<void>
  removeEvent: (event: Evento) => Promise<void>
  openModalities: (event: Evento) => void
  closeModalities: () => void
  editModality: (item: ModalidadEvento) => void
  resetModality: () => void
  setModalityField: <K extends keyof ModalityForm>(field: K, value: ModalityForm[K]) => void
  saveModality: () => Promise<void>
  removeModality: (item: ModalidadEvento) => Promise<void>
  openCategories: (event: Evento) => void
  closeCategories: () => void
  editCategory: (item: CategoriaEvento) => void
  resetCategory: () => void
  setCategoryField: <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => void
  saveCategory: () => Promise<void>
  removeCategory: (item: CategoriaEvento) => Promise<void>
  openRegistrations: (event: Evento) => void
  closeRegistrations: () => void
  updateRegistrationStatus: (id: string, status: InscripcionEvento['estado']) => Promise<void>
  updateRegistrationBib: (id: string, bib: string) => Promise<void>
}

export const useEventsStore = create<EventsState>((set, get) => ({
  scope: 'business', contextBusinessId: null, events: [], modalities: [], categories: [], registrations: [], businesses: [], sports: [], cities: [], plans: [], search: '', loading: false, saving: false, error: '', message: '', eventOpen: false, editingEvent: null, eventForm: emptyEvent, modalityEvent: null, editingModality: null, modalityForm: emptyModality, categoryEvent: null, editingCategory: null, categoryForm: emptyCategory, registrationEvent: null,
  load: async (scope, businessId) => {
    set({ loading: true, error: '', scope, contextBusinessId: businessId ?? null })
    try {
      const data = await eventRepository.fetchWorkspace(businessId)
      set({ ...data, loading: false })
    } catch (error) {
      set({ loading: false, error: failure(error) })
    }
  },
  setSearch: (search) => set({ search }),
  clearFeedback: () => set({ error: '', message: '' }),
  openEventCreate: () => {
    const state = get()
    const business = state.businesses.find((item) => item.id === state.contextBusinessId) ?? state.businesses[0]
    const timezone = business?.zona_horaria ?? business?.timezone ?? 'America/Bogota'
    const tomorrow = addDaysToDateKey(dateKeyInTimeZone(timezone), 1)
    set({ editingEvent: null, eventOpen: true, error: '', eventForm: { ...emptyEvent, businessId: business?.id ?? '', sportId: state.sports[0]?.id ?? '', cityId: business?.ciudad_id ?? '', currency: business?.moneda_codigo ?? business?.moneda ?? 'COP', timezone, start: `${tomorrow}T06:00`, end: `${tomorrow}T12:00` } })
  },
  openEventEdit: (event) => set({
    editingEvent: event, eventOpen: true, error: '', eventForm: {
      businessId: event.negocio_id, sportId: event.deporte_id, cityId: event.ciudad_id ?? '', name: event.nombre,
      slug: event.slug, description: event.descripcion ?? '', address: event.direccion ?? '',
      start: isoToZonedDateTimeInput(event.inicio_at, event.zona_horaria), end: isoToZonedDateTimeInput(event.fin_at, event.zona_horaria),
      registrationsOpen: isoToZonedDateTimeInput(event.inscripciones_abren_en, event.zona_horaria), registrationsClose: isoToZonedDateTimeInput(event.inscripciones_cierran_en, event.zona_horaria),
      capacity: event.capacidad_total ? String(event.capacidad_total) : '', status: event.estado, isPublic: event.es_publico,
      coverUrl: event.portada_url ?? '', rulesUrl: event.reglamento_url ?? '', timezone: event.zona_horaria, currency: event.moneda_codigo,
      requiresBib: event.requiere_dorsal, bibStart: String(event.dorsal_inicial), requestsShirtSize: event.solicita_talla_camiseta, shirtSizes: event.tallas_camiseta.join(', '),
    },
  }),
  closeEvent: () => set({ eventOpen: false, error: '' }),
  setEventField: (field, value) => set((state) => {
    const sport = field === 'sportId' ? state.sports.find((item) => item.id === value) : null
    const runningDefaults = field === 'sportId' && !state.editingEvent && sport?.slug === 'running'
    return { eventForm: { ...state.eventForm, [field]: value, ...(field === 'name' && !state.editingEvent ? { slug: slugify(String(value)) } : {}), ...(runningDefaults ? { requiresBib: true, requestsShirtSize: true } : {}) } }
  }),
  selectBusiness: (businessId) => {
    const state = get(), business = state.businesses.find((item) => item.id === businessId)
    set({ eventForm: { ...state.eventForm, businessId, cityId: business?.ciudad_id ?? '', currency: business?.moneda_codigo ?? business?.moneda ?? state.eventForm.currency, timezone: business?.zona_horaria ?? business?.timezone ?? state.eventForm.timezone } })
  },
  saveEvent: async () => {
    const state = get(), form = state.eventForm
    if (!form.businessId || !form.sportId || !form.name.trim() || !form.slug || !form.start || !form.end) return set({ error: 'Completa los campos obligatorios del evento.' })
    const start = zonedDateTimeInputToIso(form.start, form.timezone), end = zonedDateTimeInputToIso(form.end, form.timezone)
    if (!start || !end || start >= end) return set({ error: 'La fecha final debe ser posterior a la fecha inicial.' })
    const registrationsOpen = zonedDateTimeInputToIso(form.registrationsOpen, form.timezone)
    const registrationsClose = zonedDateTimeInputToIso(form.registrationsClose, form.timezone)
    if (registrationsOpen && registrationsClose && registrationsOpen >= registrationsClose) return set({ error: 'El cierre de inscripciones debe ser posterior a la apertura.' })
    set({ saving: true, error: '' })
    try {
      const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      await eventRepository.saveEvent(state.editingEvent?.id ?? null, { negocio_id: form.businessId, deporte_id: form.sportId, ciudad_id: form.cityId || null, nombre: form.name.trim(), slug: form.slug, descripcion: form.description.trim() || null, direccion: form.address.trim() || null, inicio_at: start, fin_at: end, inscripciones_abren_en: registrationsOpen, inscripciones_cierran_en: registrationsClose, capacidad_total: optionalNumber(form.capacity), estado: form.status, es_publico: form.isPublic, portada_url: form.coverUrl.trim() || null, reglamento_url: form.rulesUrl.trim() || null, zona_horaria: form.timezone, moneda_codigo: form.currency, requiere_dorsal: form.requiresBib, dorsal_inicial: Math.max(1, Number(form.bibStart) || 1), solicita_talla_camiseta: form.requestsShirtSize, tallas_camiseta: shirtSizes.length ? shirtSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'] })
      await get().load(state.scope, state.contextBusinessId ?? undefined)
      set({ saving: false, eventOpen: false, message: state.editingEvent ? 'Evento actualizado.' : 'Evento creado.' })
    } catch (error) { set({ saving: false, error: failure(error) }) }
  },
  removeEvent: async (event) => {
    try { await eventRepository.deleteEvent(event.id); await get().load(get().scope, get().contextBusinessId ?? undefined); set({ message: 'Evento eliminado.' }) }
    catch (error) { set({ error: failure(error) }) }
  },
  openModalities: (modalityEvent) => set({ modalityEvent, editingModality: null, modalityForm: emptyModality, error: '' }),
  closeModalities: () => set({ modalityEvent: null, error: '' }),
  editModality: (item) => {
    const event = get().modalityEvent
    set({ editingModality: item, modalityForm: { name: item.nombre, slug: item.slug, description: item.descripcion ?? '', distance: item.distancia ? String(item.distancia) : '', distanceUnit: item.unidad_distancia ?? 'km', start: event ? isoToZonedDateTimeInput(item.inicio_at, event.zona_horaria) : '', capacity: item.capacidad ? String(item.capacidad) : '', price: String(minorToMajor(item.precio_base_minor, item.moneda_codigo)), active: item.activa } })
  },
  resetModality: () => set({ editingModality: null, modalityForm: emptyModality, error: '' }),
  setModalityField: (field, value) => set((state) => ({ modalityForm: { ...state.modalityForm, [field]: value, ...(field === 'name' && !state.editingModality ? { slug: slugify(String(value)) } : {}) } })),
  saveModality: async () => {
    const state = get(), event = state.modalityEvent, form = state.modalityForm
    if (!event || !form.name.trim() || !form.slug) return set({ error: 'Nombre e identificador son obligatorios.' })
    set({ saving: true, error: '' })
    try {
      await eventRepository.saveModality(state.editingModality?.id ?? null, { evento_id: event.id, negocio_id: event.negocio_id, nombre: form.name.trim(), slug: form.slug, descripcion: form.description.trim() || null, distancia: optionalNumber(form.distance), unidad_distancia: form.distance ? form.distanceUnit.trim() || null : null, inicio_at: zonedDateTimeInputToIso(form.start, event.zona_horaria), capacidad: optionalNumber(form.capacity), precio_base_minor: majorToMinor(form.price, event.moneda_codigo), moneda_codigo: event.moneda_codigo, activa: form.active })
      await get().load(state.scope, state.contextBusinessId ?? undefined)
      set({ saving: false, editingModality: null, modalityForm: emptyModality, message: 'Modalidad guardada.' })
    } catch (error) { set({ saving: false, error: failure(error) }) }
  },
  removeModality: async (item) => {
    try { await eventRepository.deleteModality(item.id); await get().load(get().scope, get().contextBusinessId ?? undefined); set({ message: 'Modalidad eliminada.' }) }
    catch (error) { set({ error: failure(error) }) }
  },
  openCategories: (categoryEvent) => set({ categoryEvent, editingCategory: null, categoryForm: emptyCategory, error: '' }),
  closeCategories: () => set({ categoryEvent: null, error: '' }),
  editCategory: (item) => set({ editingCategory: item, categoryForm: { modalityId: item.modalidad_evento_id ?? '', name: item.nombre, gender: item.genero ?? '', minimumAge: item.edad_minima === null ? '' : String(item.edad_minima), maximumAge: item.edad_maxima === null ? '' : String(item.edad_maxima), minimumWeight: item.peso_minimo === null ? '' : String(item.peso_minimo), maximumWeight: item.peso_maximo === null ? '' : String(item.peso_maximo), level: item.nivel ?? '', active: item.activa } }),
  resetCategory: () => set({ editingCategory: null, categoryForm: emptyCategory, error: '' }),
  setCategoryField: (field, value) => set((state) => ({ categoryForm: { ...state.categoryForm, [field]: value } })),
  saveCategory: async () => {
    const state = get(), event = state.categoryEvent, form = state.categoryForm
    if (!event || !form.name.trim()) return set({ error: 'El nombre de la categoria es obligatorio.' })
    set({ saving: true, error: '' })
    try {
      await eventRepository.saveCategory(state.editingCategory?.id ?? null, { evento_id: event.id, negocio_id: event.negocio_id, modalidad_evento_id: form.modalityId || null, nombre: form.name.trim(), genero: form.gender.trim() || null, edad_minima: optionalNumber(form.minimumAge), edad_maxima: optionalNumber(form.maximumAge), peso_minimo: optionalNumber(form.minimumWeight), peso_maximo: optionalNumber(form.maximumWeight), nivel: form.level.trim() || null, activa: form.active })
      await get().load(state.scope, state.contextBusinessId ?? undefined)
      set({ saving: false, editingCategory: null, categoryForm: emptyCategory, message: 'Categoria guardada.' })
    } catch (error) { set({ saving: false, error: failure(error) }) }
  },
  removeCategory: async (item) => {
    try { await eventRepository.deleteCategory(item.id); await get().load(get().scope, get().contextBusinessId ?? undefined); set({ message: 'Categoria eliminada.' }) }
    catch (error) { set({ error: failure(error) }) }
  },
  openRegistrations: (registrationEvent) => set({ registrationEvent, error: '' }),
  closeRegistrations: () => set({ registrationEvent: null, error: '' }),
  updateRegistrationStatus: async (id, estado) => {
    const state = get()
    try { await eventRepository.updateRegistration(id, { estado }); await get().load(state.scope, state.contextBusinessId ?? undefined); set({ message: 'Estado de inscripción actualizado.' }) }
    catch (error) { set({ error: failure(error) }) }
  },
  updateRegistrationBib: async (id, numero_dorsal) => {
    const state = get()
    try { await eventRepository.updateRegistration(id, { numero_dorsal: numero_dorsal.trim() || null }); await get().load(state.scope, state.contextBusinessId ?? undefined); set({ message: 'Dorsal actualizado.' }) }
    catch (error) { set({ error: failure(error) }) }
  },
}))
