import { AppButton, AppInput } from '../../../shared/components/MuiPrimitives'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/useAuthStore'
import { AuthCard } from './LoginPage'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'

export function UpdatePasswordPage() {
  const form = useAuthStore((state) => state.passwordForm)
  const error = useAuthStore((state) => state.error)
  const message = useAuthStore((state) => state.message)
  const submitting = useAuthStore((state) => state.submitting)
  const setField = useAuthStore((state) => state.setPasswordField)
  const changePassword = useAuthStore((state) => state.changePassword)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void changePassword() }
  return <AuthCard title="Nueva contraseña" description="Define una contraseña de al menos ocho caracteres."><form className="space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-zinc-700">Nueva contraseña<AppInput className="field mt-1.5" required minLength={8} type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} /></label><label className="block text-sm font-semibold text-zinc-700">Confirmar contraseña<AppInput className="field mt-1.5" required minLength={8} type="password" value={form.confirmation} onChange={(event) => setField('confirmation', event.target.value)} /></label><FeedbackAlert message={error} /><FeedbackAlert message={message} severity="success" /><AppButton className="primary-button w-full" disabled={submitting}>{submitting ? 'Actualizando...' : 'Actualizar contraseña'}</AppButton></form>{message && <Link className="mt-5 block text-center text-sm font-semibold text-emerald-700" to="/negocio">Ir al panel</Link>}</AuthCard>
}
