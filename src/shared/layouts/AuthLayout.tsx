import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { ThemeModeButton } from '../components/ThemeModeButton'

export function AuthLayout() {
  return <Box sx={{ minHeight: '100vh', position: 'relative' }}><Box sx={{ position: 'fixed', right: 16, top: 12, zIndex: 10 }}><ThemeModeButton /></Box><Outlet /></Box>
}
