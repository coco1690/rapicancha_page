import { AppButton, AppInput } from '../../../shared/components/MuiPrimitives'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/useAuthStore'
import { AuthCard } from './LoginPage'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'

export function ResetPasswordPage() {
  const email = useAuthStore((state) => state.resetForm.email)
  const error = useAuthStore((state) => state.error)
  const message = useAuthStore((state) => state.message)
  const submitting = useAuthStore((state) => state.submitting)
  const setEmail = useAuthStore((state) => state.setResetEmail)
  const requestReset = useAuthStore((state) => state.requestPasswordReset)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void requestReset(`${window.location.origin}/actualizar-contrasena`) }
  return <AuthCard title="Recuperar acceso" description="Recibe un enlace seguro en tu correo."><form className="space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-zinc-700">Correo<AppInput className="field mt-1.5" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><FeedbackAlert message={error} /><FeedbackAlert message={message} severity="success" /><AppButton className="primary-button w-full" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar enlace'}</AppButton></form><Link className="mt-5 block text-center text-sm font-semibold text-emerald-700" to="/acceso">Volver al acceso</Link></AuthCard>
}
