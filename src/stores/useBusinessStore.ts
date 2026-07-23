import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { businessRepository } from '../services/repositories/businessRepository'
import { playBookingNotificationSound } from '../services/notifications/notificationSound'
import { checkoutRepository } from '../services/repositories/checkoutRepository'
import { clearPendingCheckout, findPendingCheckoutsForCourts } from '../services/payments/pendingCheckout'
import type { BusinessNotification, Cancha, CanchaTarifa, Ciudad, Departamento, Deporte, Negocio, Pais, Plan, PublicBusiness, PublicCourt, Reserva, Usuario } from '../services/supabase/tables'
import { majorToMinor, minorToMajor } from '../shared/lib/money'

export type CourtWithSport = Cancha & { deportes: { nombre: string; slug: string } | null }
export type ReservationWithCourt = Reserva & { canchas: { nombre: string } | null }
export type TrialStatus = { active: boolean; expiresAt: string; formattedDate: string; daysLeft: number | null; shouldWarn: boolean; expired: boolean }
export type PublicCourtSlot = { time: string; endTime: string; label: string; priceMinor: number; currency: string; available?: boolean }
type PublicAvailabilityByKey = Record<string, PublicCourtSlot[]>
export type BusinessProfileForm = {
  ownerName: string; ownerPhone: string; name: string; description: string; phone: string; email: string
  address: string; countryId: string; departmentId: string; cityId: string; departmentText: string
  cityText: string; currency: string; timezone: string; openingTime: string; closingTime: string; logoUrl: string
}
export type CourtForm = { name: string; sportId: string; description: string; capacity: string; surface: string; price: string; covered: boolean; lighting: boolean }

const emptyProfile: BusinessProfileForm = { ownerName: '', ownerPhone: '', name: '', description: '', phone: '', email: '', address: '', countryId: '', departmentId: '', cityId: '', departmentText: '', cityText: '', currency: 'COP', timezone: 'America/Bogota', openingTime: '06:00', closingTime: '23:00', logoUrl: '' }
const emptyCourt: CourtForm = { name: '', sportId: '', description: '', capacity: '', surface: '', price: '', covered: false, lighting: true }
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const todayKey = () => new Date().toISOString().slice(0, 10)
const weekdayForDate = (date: string) => { const day = new Date(`${date}T12:00:00`).getDay(); return day === 0 ? 7 : day }
const formatPublicDateLabel = (date: string) => {
  const parsedDate = new Date(`${date}T12:00:00`)
  const label = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(parsedDate)
  return label.charAt(0).toUpperCase() + label.slice(1)
}
const addHour = (time: string) => `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`
const formatSlotTime = (time: string) => time.slice(0, 5)
const formatSlotLabel = (start: string, end: string) => `${formatSlotTime(start)} - ${formatSlotTime(end)}`
const availabilityKey = (courtId: string, date: string) => `${courtId}:${date}`
const buildSlots = (court: PublicCourt, rates: CanchaTarifa[], business: PublicBusiness | null, selectedDate: string): PublicCourtSlot[] => {
  const weekday = weekdayForDate(selectedDate)
  const courtRates = rates.filter((rate) => rate.cancha_id === court.id && rate.dias_semana.includes(weekday))
  const source = courtRates.length > 0 ? courtRates : [{
    hora_inicio: business?.horario_apertura ?? '06:00',
    hora_fin: business?.horario_cierre ?? '23:00',
    precio_minor: court.precio_por_hora_minor ?? 0,
    moneda_codigo: court.moneda ?? business?.moneda ?? 'COP',
  }]
  return source.flatMap((rate) => {
    const slots: PublicCourtSlot[] = []
    let current = rate.hora_inicio.slice(0, 5)
    const end = rate.hora_fin.slice(0, 5)
    while (current < end && slots.length < 18) {
      const endTime = addHour(current)
      if (endTime <= end) slots.push({ time: current, endTime, label: formatSlotLabel(current, endTime), priceMinor: rate.precio_minor, currency: rate.moneda_codigo, available: true })
      current = endTime
    }
    return slots
  })
}
const getTrialStatus = (business: Negocio | null): TrialStatus => {
  if (!business?.fecha_fin_prueba || business.estado_suscripcion !== 'trialing') return { active: false, expiresAt: '', formattedDate: '', daysLeft: null, shouldWarn: false, expired: false }
  const expiresAt = new Date(business.fecha_fin_prueba)
  const today = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / dayMs)
  return {
    active: true,
    expiresAt: business.fecha_fin_prueba,
    formattedDate: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(expiresAt),
    daysLeft,
    shouldWarn: daysLeft >= 0 && daysLeft <= 5,
    expired: daysLeft < 0,
  }
}

type BusinessState = {
  business: Negocio | null; plan: Plan | null; courts: CourtWithSport[]; reservations: ReservationWithCourt[]; notifications: BusinessNotification[]; unreadNotifications: number
  countries: Pais[]; departments: Departamento[]; cities: Ciudad[]; plans: Plan[]; sports: Deporte[]
  loading: boolean; catalogsLoading: boolean; saving: boolean; busyId: string; error: string | null; message: string
  profileForm: BusinessProfileForm; courtForm: CourtForm; editingCourt: CourtWithSport | null; courtFormOpen: boolean
  selectedMonth: string; selectedCourt: string; reservationMode: 'list' | 'calendar'
  trialStatus: TrialStatus
  publicBusiness: PublicBusiness | null; publicCourts: PublicCourt[]; publicRates: CanchaTarifa[]; publicLoading: boolean; publicAvailabilityLoading: boolean; publicAvailabilityError: string; publicAvailability: PublicAvailabilityByKey; publicSelectedDate: string; publicSelectedCourtId: string; publicSelectedSlotTime: string; publicPendingRevision: number
  publicSlotsForCourt: (court: PublicCourt) => PublicCourtSlot[]; publicSelectedDateLabel: () => string; setPublicSelectedDate: (date: string) => Promise<void>; openPublicSchedule: (courtId: string) => Promise<void>; closePublicSchedule: () => void; setPublicSelectedSlotTime: (time: string) => void; loadPublicAvailability: (courtId: string, date: string, force?: boolean) => Promise<void>; syncPublicPendingCheckouts: () => Promise<void>
  load: (userId: string) => Promise<void>; refresh: (userId: string) => Promise<void>; clear: () => void
  subscribeReservationsRealtime: (userId: string) => () => void; markNotificationRead: (id: string) => Promise<void>
  loadPublicBusiness: (slug: string) => Promise<void>
  loadCatalogs: () => Promise<void>; hydrateProfileForm: (user: User | null, profile: Usuario | null) => void
  setProfileField: (field: keyof BusinessProfileForm, value: string) => void; selectCountry: (id: string) => void; selectDepartment: (id: string) => void
  saveProfile: (user: User, refreshProfile: () => Promise<void>) => Promise<void>
  openCourtCreate: () => void; openCourtEdit: (court: CourtWithSport) => void; closeCourtForm: () => void
  setCourtField: <K extends keyof CourtForm>(field: K, value: CourtForm[K]) => void; saveCourt: (userId: string) => Promise<void>; toggleCourt: (court: CourtWithSport, userId: string) => Promise<void>
  setSelectedMonth: (value: string) => void; setSelectedCourt: (value: string) => void; setReservationMode: (value: 'list' | 'calendar') => void; clearFeedback: () => void
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  business: null, plan: null, courts: [], reservations: [], notifications: [], unreadNotifications: 0, countries: [], departments: [], cities: [], plans: [], sports: [],
  loading: false, catalogsLoading: false, saving: false, busyId: '', error: null, message: '', profileForm: emptyProfile,
  trialStatus: getTrialStatus(null),
  publicBusiness: null, publicCourts: [], publicRates: [], publicLoading: false, publicAvailabilityLoading: false, publicAvailabilityError: '', publicAvailability: {}, publicSelectedDate: todayKey(), publicSelectedCourtId: '', publicSelectedSlotTime: '', publicPendingRevision: 0,
  courtForm: emptyCourt, editingCourt: null, courtFormOpen: false, selectedMonth: new Date().toISOString().slice(0, 7), selectedCourt: 'all', reservationMode: 'list',
  load: async (userId) => { set({ loading: true, error: null }); try { const data = await businessRepository.fetchDashboard(userId) as { business: Negocio | null; plan: Plan | null; courts: CourtWithSport[]; reservations: ReservationWithCourt[]; notifications: BusinessNotification[] }; set({ ...data, unreadNotifications: data.notifications.filter((item) => !item.leida).length, trialStatus: getTrialStatus(data.business), loading: false }) } catch (error) { set({ loading: false, error: errorMessage(error, 'No se pudo cargar el negocio.') }) } },
  refresh: async (userId) => { try { const data = await businessRepository.fetchDashboard(userId) as { business: Negocio | null; plan: Plan | null; courts: CourtWithSport[]; reservations: ReservationWithCourt[]; notifications: BusinessNotification[] }; set({ ...data, unreadNotifications: data.notifications.filter((item) => !item.leida).length, trialStatus: getTrialStatus(data.business), error: null }) } catch (error) { set({ error: errorMessage(error, 'No se pudo actualizar el negocio.') }) } },
  subscribeReservationsRealtime: (userId) => {
    const businessId = get().business?.id
    if (!businessId) return () => undefined
    const refresh = () => { void get().refresh(userId) }
    const unsubscribeReservations = businessRepository.subscribeToBusinessReservations(businessId, refresh)
    const unsubscribeNotifications = businessRepository.subscribeToBusinessNotifications(businessId, (eventType) => { if (eventType === 'INSERT') playBookingNotificationSound(); refresh() })
    return () => { unsubscribeReservations(); unsubscribeNotifications() }
  },
  markNotificationRead: async (id) => { await businessRepository.markNotificationRead(id); set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, leida: true } : item), unreadNotifications: state.notifications.filter((item) => item.id !== id && !item.leida).length })) },
  clear: () => set({ business: null, plan: null, courts: [], reservations: [], notifications: [], unreadNotifications: 0, trialStatus: getTrialStatus(null), loading: false, error: null }),
  clearFeedback: () => set({ error: null, message: '' }),
  loadCatalogs: async () => { set({ catalogsLoading: true }); try { set({ ...(await businessRepository.fetchCatalogs()), catalogsLoading: false }) } catch (error) { set({ catalogsLoading: false, error: errorMessage(error, 'No se pudieron cargar los catalogos.') }) } },
  hydrateProfileForm: (user, profile) => {
    const { business, countries, cities } = get()
    const country = countries.find((item) => item.codigo_iso2 === business?.pais_codigo)
    const city = cities.find((item) => item.id === business?.ciudad_id)
    set({ profileForm: { ownerName: profile?.nombre ?? '', ownerPhone: profile?.telefono ?? '', name: business?.nombre ?? '', description: business?.descripcion ?? '', phone: business?.telefono ?? '', email: business?.email ?? user?.email ?? '', address: business?.direccion ?? '', countryId: country?.id ?? '', departmentId: city?.departamento_id ?? '', cityId: business?.ciudad_id ?? '', departmentText: business?.departamento ?? '', cityText: business?.ciudad ?? '', currency: business?.moneda_codigo ?? business?.moneda ?? country?.moneda_codigo ?? 'COP', timezone: business?.zona_horaria ?? business?.timezone ?? country?.zona_horaria_default ?? 'America/Bogota', openingTime: business?.horario_apertura?.slice(0, 5) ?? '06:00', closingTime: business?.horario_cierre?.slice(0, 5) ?? '23:00', logoUrl: business?.logo_url ?? '' } })
  },
  setProfileField: (field, value) => set((state) => ({ profileForm: { ...state.profileForm, [field]: value } })),
  selectCountry: (countryId) => { const state = get(); const country = state.countries.find((item) => item.id === countryId); set({ profileForm: { ...state.profileForm, countryId, departmentId: '', cityId: '', currency: country?.moneda_codigo ?? state.profileForm.currency, timezone: country?.zona_horaria_default ?? state.profileForm.timezone } }) },
  selectDepartment: (departmentId) => set((state) => ({ profileForm: { ...state.profileForm, departmentId, cityId: '' } })),
  saveProfile: async (user, refreshProfile) => {
    const state = get(); const form = state.profileForm; const country = state.countries.find((item) => item.id === form.countryId); const department = state.departments.find((item) => item.id === form.departmentId); const city = state.cities.find((item) => item.id === form.cityId); const planId = state.business?.plan_id
    if (!state.business) return set({ error: 'Primero debes elegir un plan y completar la suscripcion o recibir una prueba gratis desde administracion.' })
    if (!country || !planId) return set({ error: 'Selecciona un pais y verifica que el negocio tenga un plan asignado.' })
    if (!city && (!form.cityText.trim() || !form.departmentText.trim())) return set({ error: 'Selecciona una ciudad o escribe la ciudad y departamento.' })
    set({ saving: true, error: null, message: '' })
    try {
      await businessRepository.updateUser(user.id, { nombre: form.ownerName, telefono: form.ownerPhone || null })
      const values = { nombre: form.name.trim(), descripcion: form.description.trim() || null, telefono: form.phone.trim() || null, email: form.email.trim() || null, direccion: form.address.trim(), pais_codigo: country.codigo_iso2, ciudad_id: city?.id ?? null, departamento: department?.nombre ?? form.departmentText.trim(), ciudad: city?.nombre ?? form.cityText.trim(), moneda: form.currency, moneda_codigo: form.currency, timezone: form.timezone, zona_horaria: form.timezone, horario_apertura: form.openingTime, horario_cierre: form.closingTime, logo_url: form.logoUrl.trim() || null }
      await businessRepository.updateBusiness(state.business.id, values)
      await Promise.all([refreshProfile(), get().refresh(user.id)])
      set({ saving: false, message: 'Cambios guardados.' })
    } catch (error) { set({ saving: false, error: errorMessage(error, 'No se pudo guardar el negocio.') }) }
  },
  openCourtCreate: () => set((state) => ({ editingCourt: null, courtForm: { ...emptyCourt, sportId: state.sports[0]?.id ?? '' }, courtFormOpen: true, error: null })),
  openCourtEdit: (court) => { const currency = get().business?.moneda_codigo ?? get().business?.moneda ?? 'COP'; set({ editingCourt: court, courtForm: { name: court.nombre, sportId: court.deporte_id, description: court.descripcion ?? '', capacity: court.capacidad_jugadores?.toString() ?? '', surface: court.superficie ?? '', price: minorToMajor(court.precio_por_hora_minor, currency).toString(), covered: court.cubierta ?? court.techada, lighting: court.iluminacion }, courtFormOpen: true, error: null }) },
  closeCourtForm: () => set({ courtFormOpen: false }),
  setCourtField: (field, value) => set((state) => ({ courtForm: { ...state.courtForm, [field]: value } })),
  saveCourt: async (userId) => {
    const state = get(); if (!state.business) return
    if (state.business.estado !== 'activo') return set({ error: 'El negocio debe estar activo para crear canchas.' })
    if (!state.plan) return set({ error: 'El negocio no tiene un plan activo asignado.' })
    if (!state.courtForm.name.trim()) return set({ error: 'Ingresa el nombre de la cancha.' })
    if (!state.courtForm.sportId) return set({ error: 'Selecciona el deporte de la cancha.' })
    if (!state.editingCourt && state.plan && state.courts.length >= state.plan.limite_canchas) return set({ error: `Tu ${state.plan.nombre} permite hasta ${state.plan.limite_canchas} canchas.` })
    const price = majorToMinor(state.courtForm.price, state.business.moneda_codigo ?? state.business.moneda)
    if (!Number.isFinite(price) || price < 0) return set({ error: 'Ingresa un precio valido.' })
    const values = { nombre: state.courtForm.name.trim(), deporte_id: state.courtForm.sportId, descripcion: state.courtForm.description.trim() || null, capacidad_jugadores: state.courtForm.capacity ? Number(state.courtForm.capacity) : null, superficie: state.courtForm.surface.trim() || null, precio_por_hora_minor: price, cubierta: state.courtForm.covered, techada: state.courtForm.covered, iluminacion: state.courtForm.lighting }
    set({ saving: true, error: null })
    try { if (state.editingCourt) await businessRepository.updateCourt(state.editingCourt.id, values); else await businessRepository.createCourt({ ...values, negocio_id: state.business.id, estado: 'activa', activa: true }); await get().refresh(userId); set({ saving: false, courtFormOpen: false }) } catch (error) { set({ saving: false, error: errorMessage(error, 'No se pudo guardar la cancha.') }) }
  },
  toggleCourt: async (court, userId) => { const activating = court.estado !== 'activa' || !court.activa; set({ busyId: court.id, error: null }); try { await businessRepository.updateCourt(court.id, { estado: activating ? 'activa' : 'inactiva', activa: activating }); await get().refresh(userId); set({ busyId: '' }) } catch (error) { set({ busyId: '', error: errorMessage(error, 'No se pudo actualizar la cancha.') }) } },
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSelectedCourt: (selectedCourt) => set({ selectedCourt }),
  setReservationMode: (reservationMode) => set({ reservationMode }),
  loadPublicBusiness: async (slug) => {
    set({ publicLoading: true, error: null })
    try {
      const data = await businessRepository.fetchPublicBusiness(slug)
      set({ publicBusiness: data.business, publicCourts: data.courts, publicRates: data.rates, publicAvailability: {}, publicAvailabilityError: '', publicSelectedCourtId: '', publicSelectedSlotTime: '', publicLoading: false })
    } catch (error) {
      set({ publicBusiness: null, publicCourts: [], publicRates: [], publicAvailability: {}, publicAvailabilityError: '', publicSelectedCourtId: '', publicSelectedSlotTime: '', publicLoading: false, error: errorMessage(error, 'No se pudo cargar la pagina del negocio.') })
    }
  },
  loadPublicAvailability: async (courtId, date, force = false) => {
    const key = availabilityKey(courtId, date)
    if (!force && get().publicAvailability[key]) return
    set({ publicAvailabilityLoading: true, publicAvailabilityError: '' })
    try {
      const data = await businessRepository.fetchPublicAvailability(courtId, date)
      set((state) => ({ publicAvailability: { ...state.publicAvailability, [key]: data.slots }, publicAvailabilityLoading: false }))
    } catch (error) {
      set({ publicAvailabilityLoading: false, publicAvailabilityError: errorMessage(error, 'No se pudo cargar la disponibilidad.') })
    }
  },
  syncPublicPendingCheckouts: async () => {
    const state = get()
    const courtIds = state.publicCourts.map((court) => court.id).filter((id): id is string => Boolean(id))
    const pendingCheckouts = findPendingCheckoutsForCourts(courtIds)
    await Promise.all(pendingCheckouts.map(async (pending) => {
      try {
        const result = await checkoutRepository.fetchBookingPaymentStatus(pending.reference)
        if (result.status !== 'pending') clearPendingCheckout(pending.reference)
      } catch {
        // La disponibilidad del servidor sigue siendo la fuente final si la consulta individual falla.
      }
    }))
    const current = get()
    set((latest) => ({ publicAvailability: {}, publicPendingRevision: latest.publicPendingRevision + 1 }))
    if (current.publicSelectedCourtId) {
      await get().loadPublicAvailability(current.publicSelectedCourtId, current.publicSelectedDate, true)
    }
  },
  setPublicSelectedDate: async (publicSelectedDate) => {
    const courtId = get().publicSelectedCourtId
    set({ publicSelectedDate, publicSelectedSlotTime: '' })
    if (courtId) await get().loadPublicAvailability(courtId, publicSelectedDate)
  },
  openPublicSchedule: async (publicSelectedCourtId) => {
    const date = get().publicSelectedDate
    set({ publicSelectedCourtId, publicSelectedSlotTime: '' })
    await get().loadPublicAvailability(publicSelectedCourtId, date)
  },
  closePublicSchedule: () => set({ publicSelectedCourtId: '', publicSelectedSlotTime: '' }),
  setPublicSelectedSlotTime: (publicSelectedSlotTime) => set({ publicSelectedSlotTime }),
  publicSlotsForCourt: (court) => {
    const state = get()
    return state.publicAvailability[availabilityKey(court.id ?? '', state.publicSelectedDate)] ?? buildSlots(court, state.publicRates, state.publicBusiness, state.publicSelectedDate)
  },
  publicSelectedDateLabel: () => formatPublicDateLabel(get().publicSelectedDate),
}))
