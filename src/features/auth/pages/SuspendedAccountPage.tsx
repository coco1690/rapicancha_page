import { AppButton } from '../../../shared/components/MuiPrimitives'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/useAuthStore'

export function SuspendedAccountPage() {
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const leave = async () => { await signOut(); navigate('/acceso', { replace: true }) }

  return <main className="grid min-h-screen place-items-center bg-zinc-100 px-5"><div className="max-w-lg"><p className="section-kicker">Acceso suspendido</p><h1 className="page-title">Tu cuenta no puede acceder al panel</h1><p className="mt-3 text-zinc-600">Contacta al administrador de Rapicancha para revisar el estado de la cuenta.</p><AppButton className="primary-button mt-7" onClick={leave}>Cerrar sesion</AppButton></div></main>
}
