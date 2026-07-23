import { create } from 'zustand'
import { adminRepository } from '../../services/repositories/adminRepository'
import type { BookingStatus, Pago, Reserva } from '../../services/supabase/tables'

export type ReservationRow = Reserva & { negocios: { nombre: string } | null; canchas: { nombre: string } | null }
export type PaymentRow = Pago & {
  payment_provider?: string | null
  provider_payment_id?: string | null
  provider_checkout_id?: string | null
  provider_checkout_url?: string | null
  provider_account_id?: string | null
  provider_reference?: string | null
  negocios: { nombre: string } | null
}
type State = { reservations: ReservationRow[]; payments: PaymentRow[]; tab: 'reservations' | 'payments'; search: string; status: string; error: string; message: string; busyId: string; load: () => Promise<void>; setTab: (value: State['tab']) => void; setSearch: (value: string) => void; setStatus: (value: string) => void; updateReservationStatus: (item: ReservationRow, status: BookingStatus) => Promise<void> }
export const useAdminOperationsStore = create<State>((set, get) => ({ reservations: [], payments: [], tab: 'reservations', search: '', status: 'all', error: '', message: '', busyId: '', load: async () => { try { const data = await adminRepository.fetchOperations(); const courts = new Map(data.courts.map((item) => [item.id, item])); const businesses = new Map(data.businesses.map((item) => [item.id, item])); set({ reservations: data.reservations.map((item) => ({ ...item, canchas: courts.has(item.cancha_id) ? { nombre: courts.get(item.cancha_id)!.nombre } : null, negocios: businesses.get(item.negocio_id) ?? null })), payments: data.payments.map((item) => ({ ...item, negocios: businesses.get(item.negocio_id) ?? null })), error: '' }) } catch (error) { set({ error: error instanceof Error ? error.message : 'No se pudo cargar la operacion.' }) } }, setTab: (tab) => set({ tab, status: 'all' }), setSearch: (search) => set({ search }), setStatus: (status) => set({ status }), updateReservationStatus: async (item, status) => { set({ busyId: item.id, error: '', message: '' }); try { await adminRepository.updateReservation(item.id, { estado_reserva: status }); await get().load(); set({ busyId: '', message: 'Estado actualizado y registrado en auditoria.' }) } catch (error) { set({ busyId: '', error: error instanceof Error ? error.message : 'No se pudo actualizar la reserva.' }) } } }))
