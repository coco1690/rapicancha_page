import { Navigate } from 'react-router-dom'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { useAuthStore } from '../stores/useAuthStore'

export function RoleHomePage() {
  const profile = useAuthStore((state) => state.profile)

  if (!profile) return <LoadingScreen label="Cargando perfil..." />

  if (!profile.activo) return <Navigate replace to="/cuenta-suspendida" />

  return <Navigate replace to={profile.rol === 'admin' ? '/admin' : '/negocio'} />
}
