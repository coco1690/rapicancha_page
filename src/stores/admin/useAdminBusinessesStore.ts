import { create } from 'zustand'
import { adminRepository } from '../../services/repositories/adminRepository'
import { isPaymentProvider, type PaymentProvider } from '../../services/payments/paymentProvider'
import type { Ciudad, Departamento, Negocio, Pais, Plan, Usuario } from '../../services/supabase/tables'
import { splitPhone, toE164 } from '../../shared/lib/phone'

export type BusinessRow = Negocio & {
  payment_provider?: string | null
  provider_account_id?: string | null
  provider_onboarding_status?: string | null
  planes: { nombre: string } | null
  usuarios: { nombre: string; email: string } | null
}
export type BusinessForm = {
  ownerId: string
  planId: string
  name: string
  slug: string
  description: string
  email: string
  phone: string
  phoneCountryCode: string
  whatsappPhone: string
  whatsappCountryCode: string
  whatsappNotificationsActive: boolean
  logoUrl: string
  countryId: string
  departmentId: string
  cityId: string
  address: string
  latitude: string
  longitude: string
  currency: string
  timezone: string
  openingTime: string
  closingTime: string
  modules: string
  paymentProvider: PaymentProvider
  providerAccountId: string
  providerOnboardingStatus: string
  trialEndsAt: string
  state: NonNullable<Negocio['estado']>
  subscriptionStatus: Negocio['estado_suscripcion']
}

const emptyForm: BusinessForm = {
  ownerId: '',
  planId: '',
  name: '',
  slug: '',
  description: '',
  email: '',
  phone: '',
  phoneCountryCode: 'CO',
  whatsappPhone: '',
  whatsappCountryCode: 'CO',
  whatsappNotificationsActive: false,
  logoUrl: '',
  countryId: '',
  departmentId: '',
  cityId: '',
  address: '',
  latitude: '',
  longitude: '',
  currency: 'COP',
  timezone: 'America/Bogota',
  openingTime: '06:00',
  closingTime: '23:00',
  modules: '',
  paymentProvider: 'epayco',
  providerAccountId: '',
  providerOnboardingStatus: 'pending',
  trialEndsAt: '',
  state: 'borrador',
  subscriptionStatus: 'inactive',
}

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback
const toDateTimeLocal = (value: string | null) => value ? value.slice(0, 16) : ''
const toNullableNumber = (value: string) => value.trim() ? Number(value) : null
const parseModules = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
const trialDateIn30Days = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 16)
}

type State = {
  businesses: BusinessRow[]
  plans: Plan[]
  users: Usuario[]
  countries: Pais[]
  departments: Departamento[]
  cities: Ciudad[]
  editing: BusinessRow | null
  form: BusinessForm
  open: boolean
  formStep: number
  saving: boolean
  error: string
  message: string
  load: () => Promise<void>
  create: () => void
  edit: (item: BusinessRow) => void
  close: () => void
  setField: <K extends keyof BusinessForm>(field: K, value: BusinessForm[K]) => void
  selectCountry: (id: string) => void
  selectDepartment: (id: string) => void
  setFormStep: (value: number | ((current: number) => number)) => void
  nextStep: () => void
  save: () => Promise<void>
  cancel: (item: BusinessRow) => Promise<void>
}

export const useAdminBusinessesStore = create<State>((set, get) => ({
  businesses: [],
  plans: [],
  users: [],
  countries: [],
  departments: [],
  cities: [],
  editing: null,
  form: emptyForm,
  open: false,
  formStep: 0,
  saving: false,
  error: '',
  message: '',
  load: async () => {
    try {
      const data = await adminRepository.fetchBusinessesModule()
      set({ ...data, businesses: data.businesses as unknown as BusinessRow[], error: '' })
    } catch (error) {
      set({ error: errorMessage(error, 'No se pudieron cargar los negocios.') })
    }
  },
  create: () => {
    const state = get()
    const country = state.countries.find((item) => item.activo) ?? state.countries[0]
    const department = state.departments.find((item) => item.pais_id === country?.id && item.activo)
    const city = state.cities.find((item) => item.departamento_id === department?.id && item.activo)
    set({
      editing: null,
      form: {
        ...emptyForm,
        ownerId: state.users.find((item) => item.rol !== 'admin')?.id ?? state.users[0]?.id ?? '',
        planId: state.plans.find((item) => item.activo)?.id ?? '',
        countryId: country?.id ?? '',
        phoneCountryCode: country?.codigo_iso2 ?? 'CO',
        whatsappCountryCode: country?.codigo_iso2 ?? 'CO',
        departmentId: department?.id ?? '',
        cityId: city?.id ?? '',
        currency: country?.moneda_codigo ?? 'COP',
        timezone: country?.zona_horaria_default ?? 'America/Bogota',
      },
      error: '',
      message: '',
      formStep: 0,
      open: true,
    })
  },
  edit: (item) => {
    const state = get()
    const country = state.countries.find((value) => value.codigo_iso2 === item.pais_codigo)
    const city = state.cities.find((value) => value.id === item.ciudad_id)
    const department = state.departments.find((value) => value.id === city?.departamento_id)
    const provider = isPaymentProvider(item.payment_provider) ? item.payment_provider : 'epayco'
    set({
      editing: item,
      form: {
        ownerId: item.dueno_id,
        planId: item.plan_id,
        name: item.nombre,
        slug: item.slug,
        description: item.descripcion ?? '',
        email: item.email ?? '',
        phone: splitPhone(item.telefono, state.countries, item.pais_codigo).nationalPhone,
        phoneCountryCode: splitPhone(item.telefono, state.countries, item.pais_codigo).countryCode,
        whatsappPhone: splitPhone(item.whatsapp_telefono_e164, state.countries, item.pais_codigo).nationalPhone,
        whatsappCountryCode: splitPhone(item.whatsapp_telefono_e164, state.countries, item.pais_codigo).countryCode,
        whatsappNotificationsActive: item.whatsapp_notificaciones_activas,
        logoUrl: item.logo_url ?? '',
        countryId: country?.id ?? '',
        departmentId: department?.id ?? '',
        cityId: city?.id ?? '',
        address: item.direccion,
        latitude: (item.latitud ?? item.lat ?? '').toString(),
        longitude: (item.longitud ?? item.lng ?? '').toString(),
        currency: item.moneda_codigo ?? item.moneda,
        timezone: item.zona_horaria ?? item.timezone,
        openingTime: item.horario_apertura.slice(0, 5),
        closingTime: item.horario_cierre.slice(0, 5),
        modules: item.modulos_activos.join(', '),
        paymentProvider: provider,
        providerAccountId: item.provider_account_id ?? item.stripe_connect_id ?? item.stripe_account_id ?? '',
        providerOnboardingStatus: item.provider_onboarding_status ?? 'pending',
        trialEndsAt: toDateTimeLocal(item.fecha_fin_prueba),
        state: item.estado ?? 'borrador',
        subscriptionStatus: item.estado_suscripcion,
      },
      open: true,
      formStep: 0,
      error: '',
      message: '',
    })
  },
  close: () => set({ open: false }),
  setField: (field, value) => set((state) => {
    const form = { ...state.form, [field]: value }
    const plan = state.plans.find((item) => item.id === form.planId)
    const isFreePlan = (plan?.precio_mensual_minor ?? 1) === 0
    if (isFreePlan && form.state === 'activo') {
      form.subscriptionStatus = 'trialing'
      form.trialEndsAt = field === 'planId' || field === 'state' ? trialDateIn30Days() : form.trialEndsAt || trialDateIn30Days()
    }
    return { form }
  }),
  selectCountry: (countryId) => {
    const state = get()
    const country = state.countries.find((item) => item.id === countryId)
    const department = state.departments.find((item) => item.pais_id === countryId && item.activo)
    const city = state.cities.find((item) => item.departamento_id === department?.id && item.activo)
    set({ form: { ...state.form, countryId, departmentId: department?.id ?? '', cityId: city?.id ?? '', currency: country?.moneda_codigo ?? state.form.currency, timezone: country?.zona_horaria_default ?? state.form.timezone } })
  },
  selectDepartment: (departmentId) => {
    const state = get()
    const city = state.cities.find((item) => item.departamento_id === departmentId && item.activo)
    set({ form: { ...state.form, departmentId, cityId: city?.id ?? '' } })
  },
  setFormStep: (value) => set((state) => ({ formStep: typeof value === 'function' ? value(state.formStep) : value })),
  nextStep: () => {
    const state = get()
    if (state.formStep === 0 && (!state.form.ownerId || !state.form.planId || !state.form.name.trim())) return set({ error: 'Selecciona responsable y plan, e ingresa el nombre.' })
    if (state.formStep === 1 && (!state.form.countryId || !state.form.departmentId || !state.form.cityId || !state.form.address.trim())) return set({ error: 'Completa pais, departamento, ciudad y direccion.' })
    set({ formStep: Math.min(state.formStep + 1, 3), error: '' })
  },
  save: async () => {
    const state = get()
    const form = state.form
    const country = state.countries.find((item) => item.id === form.countryId)
    const department = state.departments.find((item) => item.id === form.departmentId)
    const city = state.cities.find((item) => item.id === form.cityId)
    const latitude = toNullableNumber(form.latitude)
    const longitude = toNullableNumber(form.longitude)
    const phoneE164 = form.phone.trim() ? toE164(form.phoneCountryCode, form.phone, state.countries) : ''
    const whatsappE164 = form.whatsappPhone.trim() ? toE164(form.whatsappCountryCode, form.whatsappPhone, state.countries) : ''

    if (!country || !department || !city) return set({ error: 'Selecciona una ubicacion valida.' })
    if (form.openingTime >= form.closingTime) return set({ error: 'La hora de cierre debe ser posterior.' })
    if ((latitude !== null && !Number.isFinite(latitude)) || (longitude !== null && !Number.isFinite(longitude))) return set({ error: 'Las coordenadas deben ser numeros validos.' })
    if (form.phone.trim() && !phoneE164) return set({ error: 'Ingresa un telefono valido con su indicativo de pais.' })
    if (form.whatsappNotificationsActive && !whatsappE164) return set({ error: 'Ingresa un WhatsApp valido con su indicativo de pais.' })

    const plan = state.plans.find((item) => item.id === form.planId)
    const isFreePlan = (plan?.precio_mensual_minor ?? 1) === 0
    const subscriptionStatus = isFreePlan && form.state === 'activo' ? 'trialing' : form.subscriptionStatus
    const trialEndsAt = isFreePlan && form.state === 'activo' ? form.trialEndsAt || trialDateIn30Days() : form.trialEndsAt

    const values = {
      dueno_id: form.ownerId,
      plan_id: form.planId,
      nombre: form.name.trim(),
      slug: form.slug.trim() || `${slugify(form.name)}-${state.editing?.id.slice(0, 6) ?? crypto.randomUUID().slice(0, 6)}`,
      descripcion: form.description.trim() || null,
      email: form.email.trim() || null,
      telefono: phoneE164 || null,
      whatsapp_telefono_e164: whatsappE164 || null,
      whatsapp_notificaciones_activas: form.whatsappNotificationsActive,
      logo_url: form.logoUrl.trim() || null,
      pais_codigo: country.codigo_iso2,
      departamento: department.nombre,
      ciudad: city.nombre,
      ciudad_id: city.id,
      direccion: form.address.trim(),
      lat: latitude,
      latitud: latitude,
      lng: longitude,
      longitud: longitude,
      moneda: form.currency,
      moneda_codigo: form.currency,
      timezone: form.timezone,
      zona_horaria: form.timezone,
      horario_apertura: form.openingTime,
      horario_cierre: form.closingTime,
      modulos_activos: parseModules(form.modules),
      payment_provider: form.paymentProvider,
      provider_account_id: form.providerAccountId.trim() || null,
      provider_onboarding_status: form.providerOnboardingStatus.trim() || 'pending',
      fecha_fin_prueba: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      estado: form.state,
      estado_suscripcion: subscriptionStatus,
    }

    set({ saving: true, error: '', message: '' })
    try {
      await adminRepository.saveBusiness(state.editing?.id ?? null, values)
      await get().load()
      set({ saving: false, open: false, message: state.editing ? 'Negocio actualizado.' : 'Negocio creado.' })
    } catch (error) {
      set({ saving: false, error: errorMessage(error, 'No se pudo guardar.') })
    }
  },
  cancel: async (item) => {
    try {
      await adminRepository.updateBusiness(item.id, { estado: 'cancelado' })
      await get().load()
      set({ message: 'Negocio cancelado. Su historial permanece disponible.' })
    } catch (error) {
      set({ error: errorMessage(error, 'No se pudo cancelar.') })
    }
  },
}))
