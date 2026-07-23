import { Google, Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, Button, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { useAuthStore } from '../../../stores/useAuthStore'
import { AuthCard } from './LoginPage'

export function RegisterPage() {
  const form = useAuthStore((state) => state.registerForm)
  const error = useAuthStore((state) => state.error)
  const message = useAuthStore((state) => state.message)
  const submitting = useAuthStore((state) => state.submitting)
  const showPassword = useAuthStore((state) => state.showRegisterPassword)
  const showConfirmation = useAuthStore((state) => state.showRegisterConfirmation)
  const setField = useAuthStore((state) => state.setRegisterField)
  const register = useAuthStore((state) => state.register)
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const togglePassword = useAuthStore((state) => state.toggleRegisterPassword)
  const toggleConfirmation = useAuthStore((state) => state.toggleRegisterConfirmation)
  const googleRedirect = `${window.location.origin}/panel`

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void register()
  }

  return <AuthCard title="Crear cuenta" description="Activa el acceso para operar tus canchas en Rapicancha.">
    <Stack spacing={2.25}>
      <Button disabled={submitting} fullWidth onClick={() => void loginWithGoogle(googleRedirect)} size="large" startIcon={<Google />} type="button" variant="outlined">Registrarme con Google</Button>
      <Divider><Typography color="text.secondary" variant="body2">o crea tu cuenta con email</Typography></Divider>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={1.75}>
          <TextField autoComplete="name" fullWidth label="Nombre completo" required value={form.nombre} onChange={(event) => setField('nombre', event.target.value)} />
          <TextField autoComplete="email" fullWidth label="Email" required type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} />
          <TextField autoComplete="new-password" fullWidth label="Password" required type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setField('password', event.target.value)} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'} edge="end" onClick={togglePassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
          <TextField autoComplete="new-password" fullWidth label="Confirmar password" required type={showConfirmation ? 'text' : 'password'} value={form.confirmation} onChange={(event) => setField('confirmation', event.target.value)} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showConfirmation ? 'Ocultar confirmacion' : 'Mostrar confirmacion'} edge="end" onClick={toggleConfirmation}>{showConfirmation ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
          <FeedbackAlert message={error} />
          <FeedbackAlert message={message} severity="success" />
          <Button disabled={submitting} fullWidth size="large" type="submit" variant="contained">{submitting ? 'Creando cuenta...' : 'Crear cuenta'}</Button>
        </Stack>
      </Box>
      <Typography color="text.secondary" sx={{ textAlign: 'center' }}>¿Ya tienes cuenta? <Typography component={Link} sx={{ color: 'primary.main', fontWeight: 900, textDecoration: 'none' }} to="/acceso">Ingresar</Typography></Typography>
    </Stack>
  </AuthCard>
}
