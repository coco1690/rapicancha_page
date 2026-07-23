import { create } from 'zustand'
import { adminRepository } from '../../services/repositories/adminRepository'
import type { Negocio } from '../../services/supabase/tables'

export type RecentBusiness = Pick<Negocio, 'id' | 'nombre' | 'ciudad' | 'pais_codigo' | 'estado' | 'creado_en'> & { planes: { nombre: string } | null }
type State = { counts: { users: number; businesses: number; courts: number; reservations: number }; recent: RecentBusiness[]; loading: boolean; error: string; load: () => Promise<void> }
export const useAdminDashboardStore = create<State>((set) => ({ counts: { users: 0, businesses: 0, courts: 0, reservations: 0 }, recent: [], loading: true, error: '', load: async () => { set({ loading: true, error: '' }); try { const data = await adminRepository.fetchDashboard(); set({ ...data, recent: data.recent as unknown as RecentBusiness[], loading: false }) } catch (error) { set({ loading: false, error: error instanceof Error ? error.message : 'No se pudo cargar el resumen.' }) } } }))
