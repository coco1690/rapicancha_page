import { useEffect } from 'react'
import { CheckCircleRounded, ConfirmationNumberOutlined, ErrorOutlineRounded, EventOutlined, PaymentsOutlined, ReplayOutlined, SportsOutlined } from '@mui/icons-material'
import { Alert, Avatar, Box, Button, Card, CardContent, CircularProgress, Container, LinearProgress, Stack, Typography } from '@mui/material'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatMinorMoney } from '../../../shared/lib/money'
import { useEventPaymentResultStore } from '../../../stores/useEventPaymentResultStore'

export function EventPaymentResultPage() {
  const { eventReference = '' } = useParams()
  const navigate = useNavigate()
  const s = useEventPaymentResultStore()
  const eventPath = s.registration?.businessSlug && s.registration.eventSlug ? `/eventos/${s.registration.businessSlug}/${s.registration.eventSlug}` : '/'
  const paid = s.status === 'paid', failed = s.status === 'failed' || s.status === 'refunded', pending = ['idle', 'checking', 'pending'].includes(s.status)

  useEffect(() => { void s.load(eventReference) }, [eventReference, s.load])
  useEffect(() => {
    if (!pending) return
    const id = window.setInterval(() => void s.load(eventReference), 2500)
    return () => window.clearInterval(id)
  }, [eventReference, pending, s.load])
  useEffect(() => {
    if (!paid) return
    const id = window.setInterval(s.tickRedirect, 1000)
    return () => window.clearInterval(id)
  }, [paid, s.tickRedirect])
  useEffect(() => { if (paid && s.redirectSeconds === 0) navigate(eventPath, { replace: true }) }, [eventPath, navigate, paid, s.redirectSeconds])

  return <Box component="main" sx={{ bgcolor: 'background.default', display: 'grid', minHeight: 'calc(100vh - 68px)', placeItems: 'center', py: { xs: 2, sm: 5 } }}><Container maxWidth="sm"><Card sx={{ borderRadius: 2, overflow: 'hidden' }}>{pending && <LinearProgress />}<CardContent sx={{ p: { xs: 2, sm: 4 } }}><Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center' }}><Avatar sx={{ bgcolor: paid ? 'success.main' : failed ? 'error.main' : 'primary.main', height: 84, width: 84 }}>{paid ? <CheckCircleRounded sx={{ fontSize: 58 }} /> : failed ? <ErrorOutlineRounded sx={{ fontSize: 54 }} /> : <CircularProgress color="inherit" size={42} />}</Avatar><Box><Typography color={paid ? 'success.main' : failed ? 'error.main' : 'primary.main'} sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>{paid ? 'Inscripción confirmada' : failed ? 'Pago no aprobado' : 'Validando transacción'}</Typography><Typography component="h1" sx={{ fontSize: { xs: 27, sm: 36 }, fontWeight: 950, lineHeight: 1.08, mt: 0.75 }}>{paid ? 'Tu cupo está confirmado' : failed ? 'No pudimos confirmar tu inscripción' : 'Estamos confirmando tu pago'}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{paid ? `Ya estás inscrito en ${s.registration?.eventName ?? 'el evento'}.` : failed ? 'La transacción fue rechazada, cancelada o reembolsada.' : 'Espera un momento mientras recibimos la confirmación segura de ePayco.'}</Typography></Box>{s.registration && <Summary registration={s.registration} />}<Typography color="text.secondary" sx={{ fontSize: 12 }}>Referencia: {eventReference.toUpperCase()}</Typography>{s.error && <Alert severity="warning" sx={{ textAlign: 'left', width: '100%' }}>{s.error}</Alert>}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%' }}>{pending && <Button disabled={s.loading} fullWidth onClick={() => void s.load(eventReference)} startIcon={<ReplayOutlined />} variant="contained">Comprobar pago</Button>}<Button component={Link} fullWidth to={eventPath} variant={paid || failed ? 'contained' : 'outlined'}>Volver al evento</Button></Stack>{paid && <Box sx={{ width: '100%' }}><Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 0.75 }}>Volveremos al evento en {s.redirectSeconds} segundos</Typography><LinearProgress value={((10 - s.redirectSeconds) / 10) * 100} variant="determinate" /></Box>}</Stack></CardContent></Card></Container></Box>
}

function Summary({ registration }: { registration: NonNullable<ReturnType<typeof useEventPaymentResultStore.getState>['registration']> }) {
  const date = registration.eventStart ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: registration.timezone }).format(new Date(registration.eventStart)) : 'Por confirmar'
  const items = [
    { icon: <ConfirmationNumberOutlined />, label: 'Inscripción', value: registration.number },
    { icon: <SportsOutlined />, label: 'Modalidad', value: registration.modalityName },
    { icon: <EventOutlined />, label: 'Fecha', value: date },
    { icon: <PaymentsOutlined />, label: 'Total', value: formatMinorMoney(registration.totalMinor, registration.currency) },
  ]
  return <Box sx={{ borderBlock: 1, borderColor: 'divider', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: '100%' }}>{items.map((item) => <Stack direction="row" key={item.label} spacing={1} sx={{ alignItems: 'center', minWidth: 0, p: 1.5 }}><Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', height: 34, width: 34 }}>{item.icon}</Avatar><Box sx={{ minWidth: 0, textAlign: 'left' }}><Typography color="text.secondary" sx={{ fontSize: 10.5, fontWeight: 800 }}>{item.label}</Typography><Typography sx={{ fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</Typography></Box></Stack>)}{registration.bib && <Typography sx={{ bgcolor: 'secondary.light', gridColumn: '1 / -1', p: 1.5, fontWeight: 950 }}>Dorsal asignado: {registration.bib}</Typography>}</Box>
}
