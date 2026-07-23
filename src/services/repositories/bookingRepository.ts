import { supabase } from '../supabase/client'
import type { Ciudad, MarketplaceCancha } from '../supabase/tables'

export type CityOption = Ciudad & { departamentos: { nombre: string; paises: { codigo_iso2: string; nombre: string } | null } | null }
export type MarketplaceCourtWithLogo = MarketplaceCancha & { negocio_logo_url?: string | null }
export type MarketplaceBusinessResult = {
  negocioId: string
  negocioNombre: string
  negocioSlug: string
  logoUrl: string | null
  ciudad: string
  departamento: string
  paisCodigo: string
  direccion: string
  sports: string[]
  courts: MarketplaceCourtWithLogo[]
}

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')

export const bookingRepository = {
  fetchMarketplace: async () => {
    const db = client()
    const { data, error } = await db.from('v_marketplace_canchas').select('*').order('negocio_nombre')
    if (error) throw error
    const courts = data ?? []
    const businessIds = Array.from(new Set(courts.map((court) => court.negocio_id).filter((id): id is string => Boolean(id))))
    if (businessIds.length === 0) return []

    const logosResult = await db.from('negocios_publicos').select('id, logo_url').in('id', businessIds)
    if (logosResult.error) throw logosResult.error
    const logos = new Map((logosResult.data ?? []).map((business) => [business.id, business.logo_url]))

    return courts.map((court) => ({ ...court, negocio_logo_url: court.negocio_id ? logos.get(court.negocio_id) ?? null : null }))
  },
  fetchCitiesByCountry: async (countryCode = 'CO') => {
    const db = client()
    const { data, error } = await db
      .from('ciudades')
      .select('*, departamentos!inner(nombre, paises!inner(codigo_iso2, nombre))')
      .eq('activo', true)
      .eq('departamentos.activo', true)
      .eq('departamentos.paises.activo', true)
      .eq('departamentos.paises.codigo_iso2', countryCode)
      .order('nombre')
    if (error) throw error
    return (data ?? []) as unknown as CityOption[]
  },
  filterMarketplace: (courts: MarketplaceCourtWithLogo[], filters: { city: string; sport: string; date: string }) => {
    const city = normalize(filters.city.trim())
    const sport = normalize(filters.sport.trim())
    return courts.filter((court) => {
      const matchesCity = !city || normalize(`${court.ciudad ?? ''} ${court.departamento ?? ''}`).includes(city)
      const matchesSport = sport === 'todos' || !sport || normalize(`${court.deporte_nombre ?? ''} ${court.deporte_slug ?? ''}`).includes(sport.replace(/\s+/g, ' '))
      return matchesCity && matchesSport
    })
  },
  groupBusinesses: (courts: MarketplaceCourtWithLogo[]): MarketplaceBusinessResult[] => {
    const grouped = new Map<string, MarketplaceBusinessResult>()
    for (const court of courts) {
      if (!court.negocio_id || !court.negocio_slug) continue
      const current = grouped.get(court.negocio_id) ?? {
        negocioId: court.negocio_id,
        negocioNombre: court.negocio_nombre ?? 'Club',
        negocioSlug: court.negocio_slug,
        logoUrl: court.negocio_logo_url ?? null,
        ciudad: court.ciudad ?? '',
        departamento: court.departamento ?? '',
        paisCodigo: court.pais_codigo ?? '',
        direccion: court.direccion ?? '',
        sports: [],
        courts: [],
      }
      current.courts.push(court)
      if (court.deporte_nombre && !current.sports.includes(court.deporte_nombre)) current.sports.push(court.deporte_nombre)
      grouped.set(court.negocio_id, current)
    }
    return Array.from(grouped.values()).sort((a, b) => a.negocioNombre.localeCompare(b.negocioNombre, 'es'))
  },
}
