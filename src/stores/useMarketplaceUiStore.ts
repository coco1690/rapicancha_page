import { create } from 'zustand'

type MarketplaceUiState = {
  floatingActionsVisible: boolean
  setFloatingActionsVisible: (visible: boolean) => void
}

export const useMarketplaceUiStore = create<MarketplaceUiState>((set) => ({
  floatingActionsVisible: false,
  setFloatingActionsVisible: (floatingActionsVisible) => set({ floatingActionsVisible }),
}))
