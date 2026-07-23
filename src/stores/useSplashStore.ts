import { create } from 'zustand'

type SplashState = {
  visible: boolean
  dismiss: () => void
}

export const useSplashStore = create<SplashState>((set) => ({
  visible: true,
  dismiss: () => set({ visible: false }),
}))
