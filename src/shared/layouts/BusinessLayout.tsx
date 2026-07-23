import { useEffect } from 'react'
import { CalendarMonthOutlined, DashboardOutlined, SettingsOutlined, SportsSoccerOutlined } from '@mui/icons-material'
import { Alert } from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useBusinessStore } from '../../stores/useBusinessStore'
import { LoadingScreen } from '../components/LoadingScreen'
import { DashboardShell, type DashboardNavItem } from './DashboardShell'

const navigation: DashboardNavItem[] = [
  { to: '/negocio', label: 'Resumen', icon: <DashboardOutlined />, group: 'Principal' },
  { to: '/negocio/reservas', label: 'Reservas', icon: <CalendarMonthOutlined />, group: 'Principal' },
  { to: '/negocio/canchas', label: 'Canchas', icon: <SportsSoccerOutlined />, group: 'Gestion' },
  { to: '/negocio/perfil', label: 'Mi negocio', icon: <SettingsOutlined />, group: 'Gestion' },
]

export function BusinessLayout() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const signOut = useAuthStore((state) => state.signOut)
  const business = useBusinessStore((state) => state.business)
  const loading = useBusinessStore((state) => state.loading)
  const error = useBusinessStore((state) => state.error)
  const load = useBusinessStore((state) => state.load)
  const clear = useBusinessStore((state) => state.clear)
  const subscribeReservationsRealtime = useBusinessStore((state) => state.subscribeReservationsRealtime)
  const navigate = useNavigate()

  useEffect(() => { if (user?.id) void load(user.id); return clear }, [clear, load, user?.id])
  useEffect(() => {
    if (!user?.id || !business?.id) return undefined
    return subscribeReservationsRealtime(user.id)
  }, [business?.id, subscribeReservationsRealtime, user?.id])
  const handleSignOut = async () => { await signOut(); navigate('/acceso', { replace: true }) }
  if (loading) return <LoadingScreen label="Cargando panel..." />

  return <DashboardShell areaLabel="Negocio" navigation={navigation} profileName={profile?.nombre || user?.email || 'Usuario'} profileSubtitle={business?.nombre || 'Configuracion pendiente'} status={business?.estado || 'Sin negocio'} onSignOut={handleSignOut} alert={error ? <Alert severity="error" square>{error}</Alert> : null}><Outlet /></DashboardShell>
}
