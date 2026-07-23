import { useEffect } from 'react'
import { AccessTimeOutlined, CalendarMonthOutlined, CheckCircleRounded, ErrorOutlineRounded, PaymentsOutlined, ReplayOutlined, SportsOutlined } from '@mui/icons-material'
import { Alert, Avatar, Box, Button, Card, CardContent, CircularProgress, Container, LinearProgress, Stack, Typography } from '@mui/material'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBookingPaymentResultStore } from '../../../stores/useBookingPaymentResultStore'
import { formatMinorMoney } from '../../../shared/lib/money'

export function BookingPaymentResultPage() {
  const { bookingReference = '' } = useParams()
  const navigate = useNavigate()
  const status = useBookingPaymentResultStore((state) => state.status)
  const reservation = useBookingPaymentResultStore((state) => state.reservation)
  const loading = useBookingPaymentResultStore((state) => state.loading)
  const error = useBookingPaymentResultStore((state) => state.error)
  const redirectSeconds = useBookingPaymentResultStore((state) => state.redirectSeconds)
  const load = useBookingPaymentResultStore((state) => state.load)
  const tickRedirect = useBookingPaymentResultStore((state) => state.tickRedirect)
  const clubPath = reservation?.businessSlug ? `/negocios/${reservation.businessSlug}` : '/'

  useEffect(() => {
    void load(bookingReference)
  }, [bookingReference, load])

  useEffect(() => {
    if (status !== 'checking' && status !== 'pending') return
    const intervalId = window.setInterval(() => void load(bookingReference), 2500)
    return () => window.clearInterval(intervalId)
  }, [bookingReference, load, status])

  useEffect(() => {
    if (status !== 'confirmed') return
    const intervalId = window.setInterval(tickRedirect, 1000)
    return () => window.clearInterval(intervalId)
  }, [status, tickRedirect])

  useEffect(() => {
    if (status === 'confirmed' && redirectSeconds === 0) navigate(clubPath, { replace: true })
  }, [clubPath, navigate, redirectSeconds, status])

  const confirmed = status === 'confirmed'
  const failed = status === 'failed' || status === 'refunded'
  const pending = status === 'checking' || status === 'pending' || status === 'idle'

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', display: 'grid', minHeight: 'calc(100vh - 68px)', placeItems: 'center', py: { xs: 2, sm: 5 } }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {pending && <LinearProgress />}
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: 'center', textAlign: 'center' }}>
              <ResultIcon confirmed={confirmed} failed={failed} pending={pending} />
              <Box>
                <Typography color={confirmed ? 'success.main' : failed ? 'error.main' : 'primary.main'} sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>
                  {confirmed ? 'Reserva confirmada' : failed ? 'Pago no aprobado' : 'Validando transaccion'}
                </Typography>
                <Typography component="h1" sx={{ fontSize: { xs: 27, sm: 36 }, fontWeight: 950, lineHeight: 1.08, mt: 0.75 }}>
                  {confirmed ? 'Tu cancha esta reservada' : failed ? 'No pudimos confirmar la reserva' : 'Estamos confirmando tu pago'}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: 13.5, sm: 16 }, lineHeight: 1.55, mt: 1 }}>
                  {confirmed
                    ? `El club ${reservation?.businessName ?? ''} ya recibio la reserva.`
                    : failed
                      ? 'La transaccion fue rechazada, cancelada o reembolsada. El horario no quedara confirmado.'
                      : 'ePayco ya proceso la solicitud. Espera un momento mientras recibimos la confirmacion segura.'}
                </Typography>
              </Box>

              {reservation && <ReservationSummary reservation={reservation} />}
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>Referencia: {bookingReference.toUpperCase()}</Typography>
              {error && <Alert severity="warning" sx={{ textAlign: 'left', width: '100%' }}>{error}</Alert>}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%' }}>
                {confirmed && <Button component={Link} fullWidth size="large" to={clubPath} variant="contained">Volver al club</Button>}
                {pending && <Button disabled={loading} fullWidth onClick={() => void load(bookingReference)} size="large" startIcon={<ReplayOutlined />} variant="contained">Comprobar pago</Button>}
                {failed && <Button component={Link} fullWidth size="large" to={clubPath} variant="contained">Elegir otro horario</Button>}
                <Button component={Link} fullWidth size="large" to="/" variant="outlined">Ir al inicio</Button>
              </Stack>

              {confirmed && <Box sx={{ width: '100%' }}>
                <Typography color="text.secondary" sx={{ fontSize: 12.5, mb: 0.75 }}>Volveremos al club en {redirectSeconds} segundos</Typography>
                <LinearProgress value={((8 - redirectSeconds) / 8) * 100} variant="determinate" />
              </Box>}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

function ResultIcon({ confirmed, failed, pending }: { confirmed: boolean; failed: boolean; pending: boolean }) {
  return <Box sx={{ alignItems: 'center', bgcolor: confirmed ? 'success.main' : failed ? 'error.main' : 'primary.main', borderRadius: '50%', color: 'common.white', display: 'flex', height: { xs: 72, sm: 88 }, justifyContent: 'center', width: { xs: 72, sm: 88 } }}>
    {confirmed && <CheckCircleRounded sx={{ fontSize: { xs: 48, sm: 60 } }} />}
    {failed && <ErrorOutlineRounded sx={{ fontSize: { xs: 46, sm: 56 } }} />}
    {pending && <CircularProgress color="inherit" size={44} thickness={4} />}
  </Box>
}

function ReservationSummary({ reservation }: { reservation: NonNullable<ReturnType<typeof useBookingPaymentResultStore.getState>['reservation']> }) {
  const items = [
    { icon: <SportsOutlined />, label: 'Cancha', value: reservation.courtName },
    { icon: <CalendarMonthOutlined />, label: 'Fecha', value: reservation.date },
    { icon: <AccessTimeOutlined />, label: 'Horario', value: `${reservation.startTime} - ${reservation.endTime}` },
    { icon: <PaymentsOutlined />, label: 'Total', value: formatMinorMoney(reservation.priceMinor, reservation.currency) },
  ]
  return <Box sx={{ borderBlock: 1, borderColor: 'divider', display: 'grid', gap: 0, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: '100%' }}>
    {items.map((item) => <Stack direction="row" key={item.label} spacing={1} sx={{ alignItems: 'center', minWidth: 0, p: { xs: 1.25, sm: 1.75 } }}>
      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', height: 34, width: 34 }}>{item.icon}</Avatar>
      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
        <Typography color="text.secondary" sx={{ fontSize: 10.5, fontWeight: 800 }}>{item.label}</Typography>
        <Typography sx={{ fontSize: { xs: 12.5, sm: 14 }, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</Typography>
      </Box>
    </Stack>)}
  </Box>
}
