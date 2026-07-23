import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../services/supabase/tables'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { useAuthStore } from '../stores/useAuthStore'

export function RoleRoute({ allowed }: { allowed: UserRole[] }) {
  const profile = useAuthStore((state) => state.profile)

  if (!profile) return <LoadingScreen label="Validando permisos..." />

  if (!profile.activo) return <Navigate replace to="/cuenta-suspendida" />

  if (!allowed.includes(profile.rol)) {
    return <Navigate replace to={profile.rol === 'admin' ? '/admin' : '/negocio'} />
  }

  return <Outlet />
}
