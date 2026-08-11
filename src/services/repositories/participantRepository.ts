import { supabase } from '../supabase/client'
import type { Participante } from '../supabase/tables'

export type ParticipantDirectoryRow = {
  id: string
  participantId: string
  businessId: string
  businessName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  acceptsEmail: boolean
  acceptsWhatsApp: boolean
  registrations: number
  eventNames: string[]
  lastRegistrationAt: string
}

type RegistrationRecord = {
  created_at: string
  negocio_id: string
  participante_id: string
  participantes: Participante | null
  eventos: { nombre: string } | null
}

type PreferenceRecord = {
  acepta_marketing_email: boolean
  acepta_marketing_whatsapp: boolean
  negocio_id: string
  participante_id: string
}

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

function ensure(error: { message: string } | null) {
  if (error) throw error
}

export const participantRepository = {
  fetchDirectory: async (businessId?: string): Promise<ParticipantDirectoryRow[]> => {
    const db = client()
    let registrationsQuery = db.from('inscripciones_evento').select('created_at, negocio_id, participante_id, participantes(*), eventos(nombre)').in('estado', ['pagada', 'confirmada', 'acreditada', 'completada']).order('created_at', { ascending: false })
    let preferencesQuery = db.from('preferencias_contacto_participante').select('*')
    let businessesQuery = db.from('negocios').select('id, nombre').order('nombre')
    if (businessId) {
      registrationsQuery = registrationsQuery.eq('negocio_id', businessId)
      preferencesQuery = preferencesQuery.eq('negocio_id', businessId)
      businessesQuery = businessesQuery.eq('id', businessId)
    }
    const [registrationsResult, preferencesResult, businessesResult] = await Promise.all([registrationsQuery, preferencesQuery, businessesQuery])
    ensure(registrationsResult.error || preferencesResult.error || businessesResult.error)
    const preferences = new Map(((preferencesResult.data ?? []) as PreferenceRecord[]).map((item) => [`${item.negocio_id}:${item.participante_id}`, item]))
    const businesses = new Map((businessesResult.data ?? []).map((item) => [item.id, item.nombre]))
    const rows = new Map<string, ParticipantDirectoryRow>()
    for (const registration of (registrationsResult.data ?? []) as unknown as RegistrationRecord[]) {
      const participant = registration.participantes
      if (!participant) continue
      const id = `${registration.negocio_id}:${participant.id}`
      const existing = rows.get(id)
      const eventName = registration.eventos?.nombre
      if (existing) {
        existing.registrations += 1
        if (eventName && !existing.eventNames.includes(eventName)) existing.eventNames.push(eventName)
        continue
      }
      const preference = preferences.get(id)
      rows.set(id, {
        id, participantId: participant.id, businessId: registration.negocio_id,
        businessName: businesses.get(registration.negocio_id) ?? 'Club',
        firstName: participant.nombres, lastName: participant.apellidos,
        email: participant.email, phone: participant.telefono_e164,
        acceptsEmail: preference?.acepta_marketing_email ?? false,
        acceptsWhatsApp: preference?.acepta_marketing_whatsapp ?? false,
        registrations: 1, eventNames: eventName ? [eventName] : [],
        lastRegistrationAt: registration.created_at,
      })
    }
    return [...rows.values()]
  },
  subscribe: (businessId: string | undefined, onChange: () => void) => {
    const suffix = businessId ?? 'admin'
    const filter = businessId ? `negocio_id=eq.${businessId}` : undefined
    const registrations = client().channel(`participantes:inscripciones:${suffix}`).on('postgres_changes', { event: '*', schema: 'public', table: 'inscripciones_evento', ...(filter ? { filter } : {}) }, onChange).subscribe()
    const participants = client().channel(`participantes:datos:${suffix}`).on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, onChange).subscribe()
    const preferences = client().channel(`participantes:preferencias:${suffix}`).on('postgres_changes', { event: '*', schema: 'public', table: 'preferencias_contacto_participante', ...(filter ? { filter } : {}) }, onChange).subscribe()
    return () => { void client().removeChannel(registrations); void client().removeChannel(participants); void client().removeChannel(preferences) }
  },
}
