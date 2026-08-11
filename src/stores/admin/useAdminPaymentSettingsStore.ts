import { create } from 'zustand'
import { paymentSettingsRepository } from '../../services/repositories/paymentSettingsRepository'
import type { ComisionPlataforma } from '../../services/supabase/tables'

type State = {
  commissions: ComisionPlataforma[]
  values: Record<string, string>
  loading: boolean
  savingId: string
  error: string
  message: string
  load: () => Promise<void>
  setValue: (id: string, value: string) => void
  toggle: (item: ComisionPlataforma, active: boolean) => Promise<void>
  save: (item: ComisionPlataforma) => Promise<void>
}

const failure = (error: unknown) => error instanceof Error ? error.message : 'No se pudo actualizar la comisión.'

export const useAdminPaymentSettingsStore = create<State>((set, get) => ({
  commissions: [], values: {}, loading: false, savingId: '', error: '', message: '',
  load: async () => {
    set({ loading: true, error: '' })
    try {
      const commissions = await paymentSettingsRepository.fetchPlatformCommissions()
      set({ commissions, values: Object.fromEntries(commissions.map((item) => [item.id, String(Number(item.porcentaje) * 100)])), loading: false })
    } catch (error) { set({ loading: false, error: failure(error) }) }
  },
  setValue: (id, value) => set((state) => ({ values: { ...state.values, [id]: value }, error: '', message: '' })),
  toggle: async (item, active) => {
    set({ savingId: item.id, error: '', message: '' })
    try {
      await paymentSettingsRepository.updatePlatformCommission(item.id, { activa: active })
      await get().load()
      set({ savingId: '', message: `Comisión de ${labelFor(item.tipo_pago)} ${active ? 'activada' : 'desactivada'}.` })
    } catch (error) { set({ savingId: '', error: failure(error) }) }
  },
  save: async (item) => {
    const raw = get().values[item.id]?.trim() ?? ''
    const percentage = Number(raw.replace(',', '.'))
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return set({ error: 'El porcentaje debe estar entre 0 y 100.' })
    set({ savingId: item.id, error: '', message: '' })
    try {
      await paymentSettingsRepository.updatePlatformCommission(item.id, { porcentaje: percentage / 100 })
      await get().load()
      set({ savingId: '', message: `Comisión de ${labelFor(item.tipo_pago)} actualizada a ${percentage}%.` })
    } catch (error) { set({ savingId: '', error: failure(error) }) }
  },
}))

export function labelFor(type: string) {
  return ({ reserva: 'reservas', evento: 'eventos', torneo: 'torneos', suscripcion: 'suscripciones' } as Record<string, string>)[type] ?? type
}
