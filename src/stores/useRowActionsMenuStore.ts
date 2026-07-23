import { create } from 'zustand'

type State = {
  rowId: string | null
  anchorEl: HTMLElement | null
  open: (rowId: string, anchorEl: HTMLElement) => void
  close: () => void
}

export const useRowActionsMenuStore = create<State>((set) => ({
  rowId: null,
  anchorEl: null,
  open: (rowId, anchorEl) => set({ rowId, anchorEl }),
  close: () => set({ rowId: null, anchorEl: null }),
}))
