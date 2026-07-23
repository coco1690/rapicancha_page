import { Google, Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, Button, Checkbox, Container, Divider, FormControlLabel, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../../../shared/components/BrandLogo'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { useAuthStore } from '../../../stores/useAuthStore'

type LocationState = { from?: string }

export function LoginPage() {
  const session = useAuthStore((state) => state.session)
  const initialized = useAuthStore((state) => state.initialized)
  const form = useAuthStore((state) => state.loginForm)
  const error = useAuthStore((state) => state.error)
  const submitting = useAuthStore((state) => state.submitting)
  const showPassword = useAuthStore((state) => state.showLoginPassword)
  const setField = useAuthStore((state) => state.setLoginField)
  const togglePassword = useAuthStore((state) => state.toggleLoginPassword)
  const login = useAuthStore((state) => state.login)
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle)
  const navigate = useNavigate()
  const location = useLocation()

  if (initialized && session) return <Navigate replace to="/panel" />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (await login()) navigate((location.state as LocationState | null)?.from ?? '/panel', { replace: true })
  }

  const googleRedirect = `${window.location.origin}/panel`

  return <AuthCard title="Bienvenido a Rapicancha" description="Administra tus canchas, horarios y reservas.">
    <Stack spacing={2.5}>
      <Button disabled={submitting} fullWidth onClick={() => void loginWithGoogle(googleRedirect)} size="large" startIcon={<Google />} type="button" variant="outlined">Continuar con Google</Button>
      <Divider><Typography color="text.secondary" variant="body2">o ingresa con email</Typography></Divider>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField autoComplete="email" fullWidth label="Email" required type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} />
          <TextField autoComplete="current-password" fullWidth label="Password" required type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setField('password', event.target.value)} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'} edge="end" onClick={togglePassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 0 }} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
            <FormControlLabel control={<Checkbox defaultChecked size="small" />} label={<Typography variant="body2">Recordar este dispositivo</Typography>} />
            <Typography component={Link} sx={{ color: 'primary.main', fontSize: 14, fontWeight: 800, textDecoration: 'none' }} to="/recuperar">Olvide mi password</Typography>
          </Stack>
          <FeedbackAlert message={error} />
          <Button disabled={submitting} fullWidth size="large" type="submit" variant="contained">{submitting ? 'Ingresando...' : 'Ingresar'}</Button>
        </Stack>
      </Box>
      <Typography color="text.secondary" sx={{ textAlign: 'center' }}>Nuevo en Rapicancha? <Typography component={Link} sx={{ color: 'primary.main', fontWeight: 900, textDecoration: 'none' }} to="/registro">Crear cuenta</Typography></Typography>
    </Stack>
  </AuthCard>
}

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Box sx={{ alignItems: 'center', background: 'linear-gradient(135deg, rgba(2, 44, 34, 0.08), rgba(6, 95, 70, 0.14))', bgcolor: '#eef7f3', display: 'flex', minHeight: '100vh', py: { xs: 2, sm: 4, md: 6 } }}>
    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={0} sx={{ borderRadius: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(420px, 520px) minmax(0, 1fr)' }, minHeight: { lg: 720 }, overflow: 'hidden', width: '100%', maxWidth: 1040 }}>
        <Box sx={{ alignItems: 'center', bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', minHeight: { xs: 'calc(100vh - 32px)', sm: 620, lg: 720 }, px: { xs: 2.25, sm: 5, md: 7 }, py: { xs: 3, sm: 5, md: 7 } }}>
          <Stack spacing={{ xs: 3, sm: 4 }} sx={{ mx: 'auto', width: '100%', maxWidth: 430 }}>
            <Box aria-label="Ir al inicio de RapiCancha" component={Link} sx={{ display: 'inline-flex', textDecoration: 'none', width: 'fit-content' }} to="/">
              <BrandLogo height={50} width={216} />
            </Box>
            <Box><Typography component="h1" sx={{ fontSize: { xs: 25, sm: 30 }, fontWeight: 950 }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography></Box>
            {children}
          </Stack>
        </Box>
        <AuthVisual />
      </Paper>
    </Container>
  </Box>
}

function AuthVisual() {
  return <Box sx={{ display: { xs: 'none', lg: 'block' }, minHeight: 720, overflow: 'hidden', position: 'relative' }}>
    <Box sx={{ backgroundImage: 'linear-gradient(140deg, rgba(2, 44, 34, .94), rgba(6, 78, 59, .72)), url("https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80")', backgroundPosition: 'center', backgroundSize: 'cover', inset: 0, position: 'absolute' }} />
    <Box sx={{ border: '1px solid rgba(255,255,255,.18)', borderRadius: 3, inset: 48, opacity: 0.35, position: 'absolute', transform: 'rotate(-14deg)' }} />
    <FloatingPanel bottom={96} left={76} title="Reservas hoy" value="32" />
    <FloatingPanel right={72} title="Canchas activas" top={92} value="12" />
    <FloatingPanel bottom={220} right={64} title="Ocupacion" value="78%" />
    <Box sx={{ bgcolor: 'rgba(255,255,255,.94)', borderRadius: 2, color: '#10201c', left: 56, p: 2, position: 'absolute', top: 280, width: 230 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 950 }}>Agenda en vivo</Typography>
      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {['06:00 - 07:00', '19:00 - 20:00', '21:00 - 22:00'].map((item) => <Stack direction="row" key={item} sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 12 }}>{item}</Typography><Box sx={{ bgcolor: 'secondary.main', borderRadius: 10, height: 7, width: 54 }} /></Stack>)}
      </Stack>
    </Box>
  </Box>
}

function FloatingPanel({ bottom, left, right, title, top, value }: { bottom?: number; left?: number; right?: number; title: string; top?: number; value: string }) {
  return <Box sx={{ bgcolor: 'rgba(255,255,255,.92)', borderRadius: 2, bottom, boxShadow: '0 20px 50px rgba(0,0,0,.25)', color: '#10201c', left, p: 2, position: 'absolute', right, top, width: 190 }}>
    <Typography sx={{ color: '#6b7471', fontSize: 12, fontWeight: 800 }}>{title}</Typography>
    <Typography sx={{ color: '#073b31', fontSize: 28, fontWeight: 950 }}>{value}</Typography>
  </Box>
}
