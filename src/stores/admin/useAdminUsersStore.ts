import { create } from 'zustand'
import { adminRepository } from '../../services/repositories/adminRepository'
import type { UserRole, Usuario } from '../../services/supabase/tables'

export type UserFilter = 'all' | UserRole

type State = {
  users: Usuario[]
  open: boolean
  name: string
  email: string
  role: UserRole
  search: string
  roleFilter: UserFilter
  page: number
  rowsPerPage: number
  saving: boolean
  error: string
  message: string
  load: () => Promise<void>
  openInvite: () => void
  close: () => void
  setName: (value: string) => void
  setEmail: (value: string) => void
  setRole: (value: UserRole) => void
  setSearch: (value: string) => void
  setRoleFilter: (value: UserFilter) => void
  setPage: (value: number) => void
  setRowsPerPage: (value: number) => void
  update: (user: Usuario, changes: { rol?: UserRole; activo?: boolean }) => Promise<void>
  invite: () => Promise<void>
}

export const useAdminUsersStore = create<State>((set, get) => ({
  users: [],
  open: false,
  name: '',
  email: '',
  role: 'cliente',
  search: '',
  roleFilter: 'all',
  page: 0,
  rowsPerPage: 10,
  saving: false,
  error: '',
  message: '',
  load: async () => {
    try {
      set({ users: await adminRepository.fetchUsers(), error: '' })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.' })
    }
  },
  openInvite: () => set({ open: true, error: '', message: '' }),
  close: () => set({ open: false }),
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setRole: (role) => set({ role }),
  setSearch: (search) => set({ search, page: 0 }),
  setRoleFilter: (roleFilter) => set({ roleFilter, page: 0 }),
  setPage: (page) => set({ page }),
  setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),
  update: async (user, changes) => {
    set({ error: '', message: '' })
    try {
      await adminRepository.updateUser(user.id, changes)
      await get().load()
      set({ message: 'Usuario actualizado correctamente.' })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudo actualizar el usuario.' })
    }
  },
  invite: async () => {
    const state = get()
    set({ saving: true, error: '', message: '' })
    try {
      await adminRepository.inviteUser({ email: state.email, nombre: state.name, rol: state.role })
      await get().load()
      set({ saving: false, open: false, name: '', email: '', role: 'cliente', message: 'Invitación enviada correctamente.' })
    } catch (error) {
      set({ saving: false, error: `No se pudo invitar. ${error instanceof Error ? error.message : ''}` })
    }
  },
}))
