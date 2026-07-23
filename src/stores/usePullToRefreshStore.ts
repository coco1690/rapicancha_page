import { create } from 'zustand'

export const PULL_TO_REFRESH_THRESHOLD = 82

type PullToRefreshState = {
  enabled: boolean
  pulling: boolean
  refreshing: boolean
  pullDistance: number
  startX: number
  startY: number
  setEnabled: (enabled: boolean) => void
  startPull: (x: number, y: number) => void
  movePull: (x: number, y: number) => number
  finishPull: () => boolean
  cancelPull: () => void
}

const resetGesture = {
  pulling: false,
  pullDistance: 0,
  startX: 0,
  startY: 0,
}

export const usePullToRefreshStore = create<PullToRefreshState>((set, get) => ({
  enabled: false,
  refreshing: false,
  ...resetGesture,
  setEnabled: (enabled) => set({ enabled }),
  startPull: (startX, startY) => {
    if (!get().enabled || get().refreshing) return
    set({ pulling: true, pullDistance: 0, startX, startY })
  },
  movePull: (x, y) => {
    const state = get()
    if (!state.pulling) return 0

    const horizontalDistance = Math.abs(x - state.startX)
    const verticalDistance = y - state.startY
    if (verticalDistance <= 0 || horizontalDistance > verticalDistance) {
      set(resetGesture)
      return 0
    }

    const pullDistance = Math.min(120, verticalDistance * 0.5)
    set({ pullDistance })
    return pullDistance
  },
  finishPull: () => {
    const shouldRefresh = get().pullDistance >= PULL_TO_REFRESH_THRESHOLD
    set({ ...resetGesture, refreshing: shouldRefresh })
    return shouldRefresh
  },
  cancelPull: () => set({ ...resetGesture, refreshing: false }),
}))
