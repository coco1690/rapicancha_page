import { supabase } from '../supabase/client'
import type { TableInsert, TableUpdate, UserRole } from '../supabase/tables'

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

function ensure(error: { message: string } | null | undefined) {
  if (error) throw error
}

export const adminRepository = {
  fetchDashboard: async () => {
    const db = client()
    const results = await Promise.all([
      db.from('usuarios').select('*', { count: 'exact', head: true }),
      db.from('negocios').select('*', { count: 'exact', head: true }),
      db.from('canchas').select('*', { count: 'exact', head: true }),
      db.from('reservas').select('*', { count: 'exact', head: true }),
      db.from('negocios').select('id, nombre, ciudad, pais_codigo, estado, creado_en, planes(nombre)').order('creado_en', { ascending: false }).limit(8),
    ])
    const error = results.find((item) => item.error)?.error
    ensure(error)
    return { counts: { users: results[0].count ?? 0, businesses: results[1].count ?? 0, courts: results[2].count ?? 0, reservations: results[3].count ?? 0 }, recent: results[4].data ?? [] }
  },

  fetchPlans: async () => { const result = await client().from('planes').select('*').order('limite_canchas'); ensure(result.error); return result.data ?? [] },
  savePlan: async (id: string | null, values: TableInsert<'planes'> | TableUpdate<'planes'>) => { const result = id ? await client().from('planes').update(values).eq('id', id) : await client().from('planes').insert(values as TableInsert<'planes'>); ensure(result.error) },
  updatePlan: async (id: string, values: TableUpdate<'planes'>) => { const result = await client().from('planes').update(values).eq('id', id); ensure(result.error) },

  fetchUsers: async () => { const result = await client().from('usuarios').select('*').order('creado_en', { ascending: false }); ensure(result.error); return result.data ?? [] },
  updateUser: async (id: string, values: { rol?: UserRole; activo?: boolean }) => { const result = await client().from('usuarios').update(values).eq('id', id); ensure(result.error) },
  inviteUser: async (values: { email: string; nombre: string; rol: UserRole }) => { const result = await client().functions.invoke('admin-users', { body: { action: 'invite', ...values } }); ensure(result.error) },

  fetchSports: async () => { const result = await client().from('deportes').select('*').order('nombre'); ensure(result.error); return result.data ?? [] },
  saveSport: async (id: string | null, values: TableInsert<'deportes'> | TableUpdate<'deportes'>) => { const result = id ? await client().from('deportes').update(values).eq('id', id) : await client().from('deportes').insert(values as TableInsert<'deportes'>); ensure(result.error) },
  updateSport: async (id: string, values: TableUpdate<'deportes'>) => { const result = await client().from('deportes').update(values).eq('id', id); ensure(result.error) },
  deleteSport: async (id: string) => { const result = await client().from('deportes').delete().eq('id', id); if (result.error) throw result.error },

  fetchLocations: async () => {
    const db = client(); const [countries, departments, cities] = await Promise.all([db.from('paises').select('*').order('nombre'), db.from('departamentos').select('*').order('nombre'), db.from('ciudades').select('*').order('nombre')])
    ensure(countries.error || departments.error || cities.error)
    return { countries: countries.data ?? [], departments: departments.data ?? [], cities: cities.data ?? [] }
  },
  saveCountry: async (id: string | null, values: TableInsert<'paises'> | TableUpdate<'paises'>) => { const result = id ? await client().from('paises').update(values).eq('id', id) : await client().from('paises').insert(values as TableInsert<'paises'>); ensure(result.error) },
  saveDepartment: async (id: string | null, values: TableInsert<'departamentos'> | TableUpdate<'departamentos'>) => { const result = id ? await client().from('departamentos').update(values).eq('id', id) : await client().from('departamentos').insert(values as TableInsert<'departamentos'>); ensure(result.error) },
  saveCity: async (id: string | null, values: TableInsert<'ciudades'> | TableUpdate<'ciudades'>) => { const result = id ? await client().from('ciudades').update(values).eq('id', id) : await client().from('ciudades').insert(values as TableInsert<'ciudades'>); ensure(result.error) },
  toggleCountry: async (id: string, active: boolean) => { const result = await client().from('paises').update({ activo: active }).eq('id', id); ensure(result.error) },
  toggleDepartment: async (id: string, active: boolean) => { const result = await client().from('departamentos').update({ activo: active }).eq('id', id); ensure(result.error) },
  toggleCity: async (id: string, active: boolean) => { const result = await client().from('ciudades').update({ activo: active }).eq('id', id); ensure(result.error) },

  fetchBusinessesModule: async () => {
    const db = client(); const results = await Promise.all([
      db.from('negocios').select('*, planes(nombre), usuarios(nombre, email)').order('creado_en', { ascending: false }), db.from('planes').select('*').order('limite_canchas'), db.from('usuarios').select('*').eq('activo', true).order('nombre'), db.from('paises').select('*').order('nombre'), db.from('departamentos').select('*').order('nombre'), db.from('ciudades').select('*').order('nombre'),
    ])
    const error = results.find((item) => item.error)?.error; ensure(error)
    return { businesses: results[0].data ?? [], plans: results[1].data ?? [], users: results[2].data ?? [], countries: results[3].data ?? [], departments: results[4].data ?? [], cities: results[5].data ?? [] }
  },
  saveBusiness: async (id: string | null, values: TableInsert<'negocios'> | TableUpdate<'negocios'>) => { const result = id ? await client().from('negocios').update(values).eq('id', id) : await client().from('negocios').insert(values as TableInsert<'negocios'>); ensure(result.error) },
  updateBusiness: async (id: string, values: TableUpdate<'negocios'>) => { const result = await client().from('negocios').update(values).eq('id', id); ensure(result.error) },

  fetchCompetitions: async () => {
    const db = client(); const results = await Promise.all([
      db.from('torneos').select('*, negocios(nombre), deportes(nombre), inscripciones_torneo(id, equipo_id, equipos(nombre))').order('creado_en', { ascending: false }), db.from('equipos').select('*, usuarios(nombre, email), jugadores_equipo(*)').order('creado_en', { ascending: false }), db.from('negocios').select('*').neq('estado', 'cancelado').order('nombre'), db.from('deportes').select('*').eq('activo', true).order('nombre'), db.from('usuarios').select('*').eq('activo', true).order('nombre'), db.from('paises').select('*').eq('activo', true).order('nombre'),
    ])
    const error = results.find((item) => item.error)?.error; ensure(error)
    return { tournaments: results[0].data ?? [], teams: results[1].data ?? [], businesses: results[2].data ?? [], sports: results[3].data ?? [], users: results[4].data ?? [], countries: results[5].data ?? [] }
  },
  saveTournament: async (id: string | null, values: TableInsert<'torneos'> | TableUpdate<'torneos'>) => { const result = id ? await client().from('torneos').update(values).eq('id', id) : await client().from('torneos').insert(values as TableInsert<'torneos'>); ensure(result.error) },
  deleteTournament: async (id: string) => { const result = await client().from('torneos').delete().eq('id', id); if (result.error) throw result.error },
  saveTeam: async (id: string | null, values: TableInsert<'equipos'> | TableUpdate<'equipos'>) => { const result = id ? await client().from('equipos').update(values).eq('id', id) : await client().from('equipos').insert(values as TableInsert<'equipos'>); ensure(result.error) },
  deleteTeam: async (id: string) => { const result = await client().from('equipos').delete().eq('id', id); if (result.error) throw result.error },
  addPlayer: async (values: TableInsert<'jugadores_equipo'>) => { const result = await client().from('jugadores_equipo').insert(values).select().single(); ensure(result.error); return result.data! },
  deletePlayer: async (id: string) => { const result = await client().from('jugadores_equipo').delete().eq('id', id); ensure(result.error) },
  assignTeam: async (values: TableInsert<'inscripciones_torneo'>) => { const result = await client().from('inscripciones_torneo').insert(values); if (result.error) throw result.error },
  unassignTeam: async (id: string) => { const result = await client().from('inscripciones_torneo').delete().eq('id', id); ensure(result.error) },

  fetchOperations: async () => {
    const db = client(); const [reservations, payments, courts, businesses] = await Promise.all([db.from('reservas').select('*').order('creado_en', { ascending: false }).limit(500), db.from('pagos').select('*').order('creado_en', { ascending: false }).limit(500), db.from('canchas').select('id, nombre, negocio_id'), db.from('negocios').select('id, nombre')])
    ensure(reservations.error || payments.error || courts.error || businesses.error)
    return { reservations: reservations.data ?? [], payments: payments.data ?? [], courts: courts.data ?? [], businesses: businesses.data ?? [] }
  },
  updateReservation: async (id: string, values: TableUpdate<'reservas'>) => { const result = await client().from('reservas').update(values).eq('id', id); ensure(result.error) },

  fetchSupport: async () => {
    const db = client(); const results = await Promise.all([
      db.from('soporte_casos').select('*, negocios(nombre), creador:usuarios!soporte_casos_creado_por_fkey(nombre), asignado:usuarios!soporte_casos_asignado_a_fkey(nombre)').order('creado_en', { ascending: false }), db.from('admin_auditoria').select('*, usuarios(nombre), negocios(nombre)').order('creado_en', { ascending: false }).limit(200), db.from('negocios').select('*').order('nombre'), db.from('usuarios').select('*').eq('rol', 'admin').eq('activo', true).order('nombre'), db.from('canchas').select('id, negocio_id, estado'), db.from('reservas').select('id, negocio_id, estado_reserva'), db.from('torneos').select('id, negocio_id, estado'), db.from('suscripciones').select('negocio_id, estado').order('creado_en', { ascending: false }),
    ])
    const error = results.find((item) => item.error)?.error; ensure(error)
    return { cases: results[0].data ?? [], audits: results[1].data ?? [], businesses: results[2].data ?? [], admins: results[3].data ?? [], courts: results[4].data ?? [], reservations: results[5].data ?? [], tournaments: results[6].data ?? [], subscriptions: results[7].data ?? [] }
  },
  saveSupportCase: async (id: string | null, values: TableInsert<'soporte_casos'> | TableUpdate<'soporte_casos'>) => { const result = id ? await client().from('soporte_casos').update(values).eq('id', id) : await client().from('soporte_casos').insert(values as TableInsert<'soporte_casos'>); ensure(result.error) },
  deleteSupportCase: async (id: string) => { const result = await client().from('soporte_casos').delete().eq('id', id); ensure(result.error) },
}
