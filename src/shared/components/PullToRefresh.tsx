import { useEffect } from 'react'
import { SportsSoccerRounded } from '@mui/icons-material'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { refreshInstalledPwa } from '../../pwa/registerPwa'
import { PULL_TO_REFRESH_THRESHOLD, usePullToRefreshStore } from '../../stores/usePullToRefreshStore'

type StandaloneNavigator = Navigator & {
  standalone?: boolean
}

function isInstalledPwa() {
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as StandaloneNavigator).standalone)
}

export function PullToRefresh() {
  const enabled = usePullToRefreshStore((state) => state.enabled)
  const pulling = usePullToRefreshStore((state) => state.pulling)
  const refreshing = usePullToRefreshStore((state) => state.refreshing)
  const pullDistance = usePullToRefreshStore((state) => state.pullDistance)
  const setEnabled = usePullToRefreshStore((state) => state.setEnabled)
  const startPull = usePullToRefreshStore((state) => state.startPull)
  const movePull = usePullToRefreshStore((state) => state.movePull)
  const finishPull = usePullToRefreshStore((state) => state.finishPull)
  const cancelPull = usePullToRefreshStore((state) => state.cancelPull)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const updateEnabled = () => setEnabled(isInstalledPwa())
    updateEnabled()
    displayMode.addEventListener('change', updateEnabled)
    return () => displayMode.removeEventListener('change', updateEnabled)
  }, [setEnabled])

  useEffect(() => {
    if (!enabled) return

    const onTouchStart = (event: TouchEvent) => {
      const target = event.target
      const isInteractive = target instanceof Element
        && Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], .MuiModal-root'))

      if (window.scrollY > 0 || event.touches.length !== 1 || isInteractive) return
      startPull(event.touches[0].clientX, event.touches[0].clientY)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const distance = movePull(event.touches[0].clientX, event.touches[0].clientY)
      if (distance > 0) event.preventDefault()
    }

    const onTouchEnd = () => {
      if (!finishPull()) return
      void refreshInstalledPwa().catch(() => {
        cancelPull()
        window.location.reload()
      })
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', cancelPull)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', cancelPull)
    }
  }, [cancelPull, enabled, finishPull, movePull, startPull])

  if (!enabled) return null

  const ready = pullDistance >= PULL_TO_REFRESH_THRESHOLD
  const progress = Math.min(1, pullDistance / PULL_TO_REFRESH_THRESHOLD)

  return <Stack
    aria-live="polite"
    className="pull-to-refresh-indicator"
    role="status"
    spacing={0.5}
    sx={{
      opacity: pulling || refreshing ? 1 : 0,
      pointerEvents: 'none',
      transform: `translate(-50%, ${refreshing ? 14 : Math.max(-52, pullDistance - 58)}px)`,
    }}
  >
    <Box className="pull-to-refresh-ball">
      {refreshing
        ? <CircularProgress color="secondary" size={24} thickness={5} />
        : <SportsSoccerRounded sx={{ fontSize: 25, transform: `rotate(${progress * 220}deg)` }} />}
    </Box>
    <Typography sx={{ color: 'common.white', fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
      {refreshing ? 'Actualizando...' : ready ? 'Suelta para actualizar' : 'Desliza para actualizar'}
    </Typography>
  </Stack>
}
