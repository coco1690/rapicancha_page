import { supabase } from '../supabase/client'
import type { TableInsert, TableUpdate } from '../supabase/tables'

export type PublicAvailabilitySlot = { time: string; endTime: string; label: string; priceMinor: number; currency: string; available?: boolean }
export type PublicAvailabilityResponse = { courtId: string; date: string; slots: PublicAvailabilitySlot[] }

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

export const businessRepository = {
  fetchDashboard: async (userId: string) => {
    const db = client()
    const businessResult = await db.from('negocios').select('*').eq('dueno_id', userId).order('creado_en', { ascending: true }).limit(1).maybeSingle()
    if (businessResult.error) throw businessResult.error
    const business = businessResult.data
    if (!business) return { business: null, plan: null, courts: [], reservations: [], notifications: [] }
    const [planResult, courtsResult, reservationsResult, notificationsResult] = await Promise.all([
      db.from('planes').select('*').eq('id', business.plan_id).maybeSingle(),
      db.from('canchas').select('*, deportes(nombre, slug)').eq('negocio_id', business.id).order('creado_en'),
      db.from('reservas').select('*, canchas(nombre)').eq('negocio_id', business.id).order('inicio_at', { ascending: true }),
      db.from('notificaciones_negocio').select('*').eq('negocio_id', business.id).order('creado_en', { ascending: false }).limit(30),
    ])
    if (planResult.error || courtsResult.error || reservationsResult.error || notificationsResult.error) throw planResult.error || courtsResult.error || reservationsResult.error || notificationsResult.error
    return { business, plan: planResult.data, courts: courtsResult.data, reservations: reservationsResult.data, notifications: notificationsResult.data ?? [] }
  },
  fetchCatalogs: async () => {
    const db = client()
    const [countries, departments, cities, plans, sports] = await Promise.all([
      db.from('paises').select('*').eq('activo', true).order('nombre'),
      db.from('departamentos').select('*').eq('activo', true).order('nombre'),
      db.from('ciudades').select('*').eq('activo', true).order('nombre'),
      db.from('planes').select('*').eq('activo', true).order('limite_canchas'),
      db.from('deportes').select('*').eq('activo', true).order('nombre'),
    ])
    const error = countries.error || departments.error || cities.error || plans.error || sports.error
    if (error) throw error
    return { countries: countries.data ?? [], departments: departments.data ?? [], cities: cities.data ?? [], plans: plans.data ?? [], sports: sports.data ?? [] }
  },
  fetchPublicBusiness: async (slug: string) => {
    const db = client()
    const businessResult = await db.from('negocios_publicos').select('*').eq('slug', slug).maybeSingle()
    if (businessResult.error) throw businessResult.error
    const business = businessResult.data
    if (!business?.id) return { business: null, courts: [] }
    const courtsResult = await db.from('canchas_publicas').select('*').eq('negocio_id', business.id).order('nombre')
    if (courtsResult.error) throw courtsResult.error
    const courtIds = (courtsResult.data ?? []).map((court) => court.id).filter((id): id is string => Boolean(id))
    const ratesResult = courtIds.length > 0 ? await db.from('cancha_tarifas').select('*').in('cancha_id', courtIds).eq('activa', true).order('hora_inicio') : { data: [], error: null }
    if (ratesResult.error) throw ratesResult.error
    return { business, courts: courtsResult.data ?? [], rates: ratesResult.data ?? [] }
  },
  fetchPublicAvailability: async (courtId: string, date: string): Promise<PublicAvailabilityResponse> => {
    const { data, error } = await client().functions.invoke<PublicAvailabilityResponse>('public-availability', { body: { courtId, date } })
    if (error) throw error
    if (!data) throw new Error('No se pudo cargar la disponibilidad.')
    return data
  },
  subscribeToBusinessReservations: (businessId: string, onChange: () => void) => {
    const channel = client()
      .channel(`reservas:negocio:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas', filter: `negocio_id=eq.${businessId}` }, onChange)
      .subscribe()
    return () => { void client().removeChannel(channel) }
  },
  subscribeToBusinessNotifications: (businessId: string, onChange: (eventType?: string) => void) => {
    const channel = client()
      .channel(`notificaciones:negocio:${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones_negocio', filter: `negocio_id=eq.${businessId}` }, (payload) => onChange(payload.eventType))
      .subscribe()
    return () => { void client().removeChannel(channel) }
  },
  markNotificationRead: async (id: string) => {
    const { error } = await client().from('notificaciones_negocio').update({ leida: true }).eq('id', id)
    if (error) throw error
  },
  updateUser: async (id: string, values: TableUpdate<'usuarios'>) => {
    const { error } = await client().from('usuarios').update(values).eq('id', id)
    if (error) throw error
  },
  createBusiness: async (values: TableInsert<'negocios'>) => {
    const { error } = await client().from('negocios').insert(values)
    if (error) throw error
  },
  updateBusiness: async (id: string, values: TableUpdate<'negocios'>) => {
    const { error } = await client().from('negocios').update(values).eq('id', id)
    if (error) throw error
  },
  createCourt: async (values: TableInsert<'canchas'>) => {
    const { error } = await client().from('canchas').insert(values)
    if (error) throw error
  },
  updateCourt: async (id: string, values: TableUpdate<'canchas'>) => {
    const { error } = await client().from('canchas').update(values).eq('id', id)
    if (error) throw error
  },
}
