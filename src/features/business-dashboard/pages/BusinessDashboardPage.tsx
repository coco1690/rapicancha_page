import { ArrowForward, CalendarMonthOutlined, CheckCircleOutlined, CreditCardOutlined, SportsSoccerOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useBusinessStore } from '../../../stores/useBusinessStore'

export function BusinessDashboardPage() {
  const profile = useAuthStore((state) => state.profile)
  const business = useBusinessStore((state) => state.business)
  const plan = useBusinessStore((state) => state.plan)
  const courts = useBusinessStore((state) => state.courts)
  const reservations = useBusinessStore((state) => state.reservations)
  const trialStatus = useBusinessStore((state) => state.trialStatus)

  if (!business) return <Box component="main" sx={{ display: 'grid', minHeight: 'calc(100vh - 64px)', placeItems: 'center', p: 3 }}><Card sx={{ width: '100%', maxWidth: 680 }}><CardContent sx={{ p: { xs: 3, sm: 5 } }}><Typography color="primary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Configuracion inicial</Typography><Typography component="h1" sx={{ mt: 1 }} variant="h1">Activa el perfil de tu negocio</Typography><Typography color="text.secondary" sx={{ mt: 2, maxWidth: 520 }}>El alta debe venir desde una suscripcion o desde una prueba gratis asignada por administracion.</Typography><Button component={Link} endIcon={<ArrowForward />} sx={{ mt: 3 }} to="/negocio/perfil" variant="contained">Ver perfil</Button></CardContent></Card></Box>

  const today = new Date().toISOString().slice(0, 10)
  const todayReservations = reservations.filter((item) => item.fecha_local === today && item.estado_reserva !== 'cancelada').length
  const activeCourts = courts.filter((court) => court.estado === 'activa' && court.activa).length
  const upcoming = reservations.filter((item) => item.fecha_local >= today && !['cancelada', 'expirada'].includes(item.estado_reserva)).slice(0, 6)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    return { key, label: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date).replace('.', ''), count: reservations.filter((item) => item.fecha_local === key && item.estado_reserva !== 'cancelada').length }
  })
  const maxDaily = Math.max(...days.map((day) => day.count), 1)

  return <Box component="main" sx={{ mx: 'auto', maxWidth: 1480, p: { xs: 2, sm: 3, lg: 4 } }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', gap: 1, mb: 3 }}>
      <Box><Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Operacion diaria</Typography><Typography component="h1" variant="h1">Resumen de hoy</Typography></Box>
      <Typography color="text.secondary" variant="body2">{new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}</Typography>
    </Stack>

    {trialStatus.shouldWarn && <Alert severity="warning" sx={{ mb: 2.5 }} action={<Button color="inherit" component={Link} size="small" to="/negocio/perfil">Ver plan</Button>}>Tu prueba vence el {trialStatus.formattedDate}. Te quedan {trialStatus.daysLeft} dias para suscribirte a un plan.</Alert>}
    {trialStatus.expired && <Alert severity="error" sx={{ mb: 2.5 }} action={<Button color="inherit" component={Link} size="small" to="/negocio/perfil">Actualizar plan</Button>}>Tu prueba vencio el {trialStatus.formattedDate}. Actualiza tu suscripcion para evitar restricciones.</Alert>}

    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.8fr) minmax(300px, .9fr)' } }}>
      <Card sx={{ minHeight: { xs: 430, sm: 220 }, overflow: 'hidden', border: 0, bgcolor: 'primary.main', color: 'common.white', backgroundImage: 'url(/images/dashboard-performance.png)', backgroundPosition: { xs: 'right bottom', sm: 'center right' }, backgroundRepeat: 'no-repeat', backgroundSize: { xs: 'auto 58%', sm: 'cover' } }}>
        <CardContent sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, display: 'flex', minHeight: { xs: 430, sm: 220 }, p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}>
          <Box sx={{ maxWidth: { xs: '100%', sm: 400 } }}>
            <Typography component="h2" sx={{ fontSize: { xs: 21, sm: 25 }, fontWeight: 900 }}>Buen dia, {profile?.nombre?.split(' ')[0] || 'Equipo'}</Typography>
            <Typography sx={{ mt: 1.5, maxWidth: 380, color: 'rgba(255,255,255,.72)', fontSize: 14, lineHeight: 1.6 }}>Tienes {todayReservations} reservas programadas hoy en {business.nombre}.</Typography>
            <Button color="secondary" component={Link} endIcon={<ArrowForward />} sx={{ mt: 2.5 }} to="/negocio/reservas" variant="contained">Abrir agenda</Button>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 900 }}>Estado del negocio</Typography>
          <Typography color="text.secondary" variant="body2">Configuracion operativa actual</Typography>
          <Stack spacing={2.25} sx={{ mt: 3 }}>
            <StatusRow label="Estado" value={business.estado || 'borrador'} />
            <StatusRow label="Suscripcion" value={business.estado_suscripcion} />
            <StatusRow label="Plan" value={plan?.nombre || 'Sin plan'} />
            {trialStatus.active && <StatusRow label="Fin de prueba" value={trialStatus.formattedDate} />}
            <StatusRow label="Moneda" value={business.moneda_codigo || business.moneda} />
            <StatusRow label="Zona horaria" value={business.zona_horaria || business.timezone} />
          </Stack>
        </CardContent>
      </Card>
    </Box>

    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, mt: 2.5 }}>
      <MetricCard icon={<CalendarMonthOutlined />} label="Reservas hoy" value={todayReservations} />
      <MetricCard icon={<CheckCircleOutlined />} label="Canchas activas" value={activeCourts} />
      <MetricCard icon={<SportsSoccerOutlined />} label="Canchas registradas" value={`${courts.length} / ${plan?.limite_canchas ?? '-'}`} />
      <MetricCard icon={<CreditCardOutlined />} label="Plan actual" value={plan?.nombre ?? 'Sin plan'} />
    </Box>

    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.8fr) minmax(300px, .9fr)' }, mt: 2.5 }}>
      <Card><CardContent sx={{ px: 0, py: 0, '&:last-child': { pb: 0 } }}><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}><Box><Typography sx={{ fontSize: 17, fontWeight: 900 }}>Proximas reservas</Typography><Typography color="text.secondary" variant="body2">Turnos confirmados y pendientes</Typography></Box><Button component={Link} endIcon={<ArrowForward />} size="small" to="/negocio/reservas">Ver agenda</Button></Stack><TableContainer><Table><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Cliente</TableCell><TableCell>Cancha</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{upcoming.map((reservation) => <TableRow hover key={reservation.id}><TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{reservation.fecha_local}</Typography><Typography color="text.secondary" variant="caption">{reservation.hora_inicio_local.slice(0, 5)}</Typography></TableCell><TableCell>{reservation.nombre_cliente}</TableCell><TableCell>{reservation.canchas?.nombre || 'Cancha'}</TableCell><TableCell><Chip color={reservation.estado_reserva === 'confirmada' ? 'success' : 'default'} label={reservation.estado_reserva.replace('_', ' ')} size="small" /></TableCell></TableRow>)}{upcoming.length === 0 && <TableRow><TableCell align="center" colSpan={4} sx={{ py: 6 }}>No hay reservas proximas.</TableCell></TableRow>}</TableBody></Table></TableContainer></CardContent></Card>
      <Card><CardContent sx={{ p: 3 }}><Typography sx={{ fontSize: 17, fontWeight: 900 }}>Reservas de la semana</Typography><Typography color="text.secondary" variant="body2">Proximos siete dias</Typography><Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-end', height: 210, mt: 3 }}>{days.map((day) => <Stack key={day.key} spacing={1} sx={{ alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}><Typography sx={{ fontSize: 11, fontWeight: 800 }}>{day.count}</Typography><Box sx={{ width: '100%', maxWidth: 28, minHeight: 8, height: `${Math.max((day.count / maxDaily) * 150, 8)}px`, borderRadius: '6px 6px 2px 2px', bgcolor: day.key === today ? 'secondary.main' : 'primary.main' }} /><Typography color="text.secondary" sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{day.label}</Typography></Stack>)}</Stack></CardContent></Card>
    </Box>
  </Box>
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) { return <Card><CardContent sx={{ p: 2.5 }}><Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}><Box><Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography><Typography sx={{ mt: 1, fontSize: 25, fontWeight: 900 }}>{value}</Typography></Box><Box sx={{ display: 'grid', width: 42, height: 42, placeItems: 'center', borderRadius: 1, bgcolor: 'secondary.light', color: 'primary.dark' }}>{icon}</Box></Stack></CardContent></Card> }
function StatusRow({ label, value }: { label: string; value: string }) { return <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}><Typography color="text.secondary" variant="body2">{label}</Typography><Chip label={value} size="small" /></Stack> }
