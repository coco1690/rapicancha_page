import { create } from 'zustand'

type DashboardShellState = {
  mobileOpen: boolean
  search: string
  openMobile: () => void
  closeMobile: () => void
  setSearch: (search: string) => void
}

export const useDashboardShellStore = create<DashboardShellState>((set) => ({
  mobileOpen: false,
  search: '',
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  setSearch: (search) => set({ search }),
}))
