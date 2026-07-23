import { useEffect } from 'react'
import { SportsBasketballRounded, SportsSoccerRounded, SportsTennisRounded, SportsVolleyballRounded } from '@mui/icons-material'
import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { useSplashStore } from '../../stores/useSplashStore'

const balls = [
  { icon: <SportsSoccerRounded />, label: 'Futbol' },
  { icon: <SportsTennisRounded />, label: 'Tenis' },
  { icon: <SportsBasketballRounded />, label: 'Baloncesto' },
  { icon: <SportsVolleyballRounded />, label: 'Voley' },
]

export function AppSplashScreen() {
  const visible = useSplashStore((state) => state.visible)
  const dismiss = useSplashStore((state) => state.dismiss)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeoutId = window.setTimeout(dismiss, reduceMotion ? 450 : 2350)
    return () => window.clearTimeout(timeoutId)
  }, [dismiss])

  if (!visible) return null

  return <Box aria-label="Cargando Rapicancha" className="rapi-splash" role="status">
    <Stack className="rapi-splash-content" spacing={3} sx={{ alignItems: 'center' }}>
      <Box alt="Rapicancha" className="rapi-splash-logo" component="img" src="/logo-rapicancha-dark.png" />
      <Box className="rapi-ball-loader">
        {balls.map((ball, index) => <Box aria-label={ball.label} className={`rapi-loader-ball rapi-loader-ball-${index + 1}`} key={ball.label}>{ball.icon}</Box>)}
        <Box className="rapi-loader-center"><SportsSoccerRounded /></Box>
      </Box>
      <Box sx={{ width: { xs: 210, sm: 260 } }}>
        <LinearProgress color="secondary" className="rapi-splash-progress" />
        <Typography sx={{ color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 800, mt: 1.25, textAlign: 'center' }}>Preparando tu próxima cancha</Typography>
      </Box>
    </Stack>
  </Box>
}
