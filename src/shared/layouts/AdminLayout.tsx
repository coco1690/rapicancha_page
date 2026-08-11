import { AccountTreeOutlined, BusinessOutlined, CreditCardOutlined, DashboardOutlined, EventAvailableOutlined, GroupsOutlined, HeadsetMicOutlined, LocationOnOutlined, PeopleOutlined, SportsSoccerOutlined, EmojiEventsOutlined, PercentOutlined } from '@mui/icons-material'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { DashboardShell, type DashboardNavItem } from './DashboardShell'

const navigation: DashboardNavItem[] = [
  { to: '/admin', label: 'Resumen', icon: <DashboardOutlined />, group: 'Principal' },
  { to: '/admin/negocios', label: 'Negocios', icon: <BusinessOutlined />, group: 'Principal' },
  { to: '/admin/operaciones', label: 'Operaciones', icon: <AccountTreeOutlined />, group: 'Principal' },
  { to: '/admin/planes', label: 'Planes', icon: <CreditCardOutlined />, group: 'Gestion' },
  { to: '/admin/comisiones', label: 'Comisiones', icon: <PercentOutlined />, group: 'Gestion' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <PeopleOutlined />, group: 'Gestion' },
  { to: '/admin/ubicaciones', label: 'Ubicaciones', icon: <LocationOnOutlined />, group: 'Gestion' },
  { to: '/admin/deportes', label: 'Deportes', icon: <SportsSoccerOutlined />, group: 'Gestion' },
  { to: '/admin/competiciones', label: 'Competiciones', icon: <EmojiEventsOutlined />, group: 'Gestion' },
  { to: '/admin/eventos', label: 'Eventos', icon: <EventAvailableOutlined />, group: 'Gestion' },
  { to: '/admin/participantes', label: 'Participantes', icon: <GroupsOutlined />, group: 'Gestion' },
  { to: '/admin/soporte', label: 'Soporte', icon: <HeadsetMicOutlined />, group: 'Gestion' },
]

export function AdminLayout() {
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const handleSignOut = async () => { await signOut(); navigate('/acceso', { replace: true }) }

  return <DashboardShell areaLabel="Administracion" navigation={navigation} profileName={profile?.nombre || 'Administrador'} profileSubtitle={user?.email || 'Rapicancha'} status="Admin" onSignOut={handleSignOut}><Outlet /></DashboardShell>
}
