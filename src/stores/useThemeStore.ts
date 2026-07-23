import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColorMode = 'light' | 'dark'

type ThemeState = {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeState>()(persist(
  (set) => ({
    mode: 'light',
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
  }),
  { name: 'rapicancha-theme' },
))
