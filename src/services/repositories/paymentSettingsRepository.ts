import { supabase } from '../supabase/client'
import type { TableUpdate } from '../supabase/tables'

function client() {
  if (!supabase) throw new Error('Supabase no esta configurado.')
  return supabase
}

function ensure(error: { message: string } | null) {
  if (error) throw error
}

export const paymentSettingsRepository = {
  fetchPlatformCommissions: async () => {
    const result = await client().from('comisiones_plataforma').select('*').order('tipo_pago')
    ensure(result.error)
    return result.data ?? []
  },
  updatePlatformCommission: async (id: string, values: TableUpdate<'comisiones_plataforma'>) => {
    const result = await client().from('comisiones_plataforma').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id)
    ensure(result.error)
  },
}
