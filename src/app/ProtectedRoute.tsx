import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { useAuthStore } from '../stores/useAuthStore'

export function ProtectedRoute() {
  const initialized = useAuthStore((state) => state.initialized)
  const session = useAuthStore((state) => state.session)
  const location = useLocation()

  if (!initialized) return <LoadingScreen label="Validando sesion..." />

  if (!session) {
    return <Navigate replace to="/acceso" state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
