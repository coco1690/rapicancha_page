import { useEffect } from 'react'
import { ArrowForward, BusinessOutlined, CalendarMonthOutlined, PeopleOutlined, SportsSoccerOutlined, TrendingUp } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAdminDashboardStore } from '../../../stores/admin/useAdminDashboardStore'
import { useAuthStore } from '../../../stores/useAuthStore'

export function AdminDashboardPage() {
  const profile = useAuthStore((state) => state.profile)
  const metrics = useAdminDashboardStore((state) => state.counts)
  const businesses = useAdminDashboardStore((state) => state.recent)
  const loading = useAdminDashboardStore((state) => state.loading)
  const error = useAdminDashboardStore((state) => state.error)
  const load = useAdminDashboardStore((state) => state.load)
  useEffect(() => { void load() }, [load])

  const totalAssets = Math.max(metrics.businesses + metrics.courts + metrics.reservations, 1)
  const courtShare = Math.round((metrics.courts / totalAssets) * 100)
  const bookingShare = Math.round((metrics.reservations / totalAssets) * 100)

  return <Box component="main" sx={{ mx: 'auto', maxWidth: 1480, p: { xs: 2, sm: 3, lg: 4 } }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', gap: 1, mb: 3 }}>
      <Box><Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Vista general</Typography><Typography component="h1" variant="h1">Panel administrativo</Typography></Box>
      <Typography color="text.secondary" variant="body2">{new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}</Typography>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.8fr) minmax(300px, .9fr)' }, gap: 2.5 }}>
      <Card sx={{ minHeight: { xs: 430, sm: 220 }, overflow: 'hidden', border: 0, bgcolor: 'primary.main', color: 'common.white', backgroundImage: 'url(/images/dashboard-performance.png)', backgroundPosition: { xs: 'right bottom', sm: 'center right' }, backgroundRepeat: 'no-repeat', backgroundSize: { xs: 'auto 58%', sm: 'cover' } }}>
        <CardContent sx={{ display: 'flex', minHeight: { xs: 430, sm: 220 }, alignItems: { xs: 'flex-start', sm: 'center' }, p: { xs: 3, md: 4 }, '&:last-child': { pb: { xs: 3, md: 4 } } }}><Box sx={{ maxWidth: { xs: '100%', sm: 390 } }}><Typography component="h2" sx={{ fontSize: { xs: 22, sm: 25 }, fontWeight: 900 }}>Hola, {profile?.nombre?.split(' ')[0] || 'Administrador'}</Typography><Typography sx={{ mt: 1.5, maxWidth: 380, color: 'rgba(255,255,255,.72)', fontSize: 14, lineHeight: 1.6 }}>Controla el crecimiento de la plataforma y detecta rapidamente dónde necesita atención la operación.</Typography><Button color="secondary" component={Link} endIcon={<ArrowForward />} sx={{ mt: 2.5 }} to="/admin/operaciones" variant="contained">Ver operaciones</Button></Box></CardContent>
      </Card>
      <Card><CardContent sx={{ p: 3 }}><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography sx={{ fontSize: 16, fontWeight: 900 }}>Actividad total</Typography><Typography color="text.secondary" variant="body2">Movimientos registrados</Typography></Box><Box sx={{ display: 'grid', width: 42, height: 42, placeItems: 'center', borderRadius: 1, bgcolor: 'secondary.50', color: 'primary.main' }}><TrendingUp /></Box></Stack><Typography sx={{ mt: 3, fontSize: 30, fontWeight: 900 }}>{loading ? '-' : metrics.reservations.toLocaleString('es-CO')}</Typography><Typography color="text.secondary" variant="caption">reservas en la plataforma</Typography><Stack direction="row" spacing={0.5} sx={{ mt: 3 }}><Box sx={{ height: 5, flex: Math.max(bookingShare, 1), borderRadius: 5, bgcolor: 'primary.main' }} /><Box sx={{ height: 5, flex: Math.max(courtShare, 1), borderRadius: 5, bgcolor: 'warning.main' }} /><Box sx={{ height: 5, flex: 20, borderRadius: 5, bgcolor: 'secondary.main' }} /></Stack><Stack direction="row" spacing={2.5} sx={{ mt: 2 }}><Legend color="primary.main" label="Reservas" /><Legend color="warning.main" label="Canchas" /><Legend color="secondary.main" label="Negocios" /></Stack></CardContent></Card>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(4,1fr)' }, gap: 2.5, mt: 2.5 }}>
      <MetricCard color="primary" icon={<PeopleOutlined />} label="Usuarios" loading={loading} value={metrics.users} />
      <MetricCard color="secondary" icon={<BusinessOutlined />} label="Negocios" loading={loading} value={metrics.businesses} />
      <MetricCard color="warning" icon={<SportsSoccerOutlined />} label="Canchas" loading={loading} value={metrics.courts} />
      <MetricCard color="info" icon={<CalendarMonthOutlined />} label="Reservas" loading={loading} value={metrics.reservations} />
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.8fr) minmax(300px, .9fr)' }, gap: 2.5, mt: 2.5 }}>
      <Card><CardContent sx={{ px: 0, py: 0, '&:last-child': { pb: 0 } }}><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}><Box><Typography sx={{ fontSize: 17, fontWeight: 900 }}>Negocios recientes</Typography><Typography color="text.secondary" variant="body2">Últimos centros incorporados</Typography></Box><Button component={Link} endIcon={<ArrowForward />} size="small" to="/admin/negocios">Ver todos</Button></Stack><TableContainer><Table><TableHead><TableRow><TableCell>Negocio</TableCell><TableCell>Ubicación</TableCell><TableCell>Plan</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{businesses.map((business) => <TableRow hover key={business.id}><TableCell><Typography sx={{ fontSize: 14, fontWeight: 800 }}>{business.nombre}</Typography><Typography color="text.secondary" variant="caption">{new Date(business.creado_en).toLocaleDateString('es-CO')}</Typography></TableCell><TableCell>{business.ciudad}, {business.pais_codigo}</TableCell><TableCell>{business.planes?.nombre ?? 'Sin plan'}</TableCell><TableCell><Chip color={business.estado === 'activo' ? 'success' : 'default'} label={business.estado ?? 'borrador'} size="small" /></TableCell></TableRow>)}{!loading && businesses.length === 0 && <TableRow><TableCell align="center" colSpan={4} sx={{ py: 6 }}>No hay negocios registrados.</TableCell></TableRow>}</TableBody></Table></TableContainer></CardContent></Card>
      <Card><CardContent sx={{ p: 3 }}><Typography sx={{ fontSize: 17, fontWeight: 900 }}>Capacidad operativa</Typography><Typography color="text.secondary" variant="body2">Relación entre inventario y demanda</Typography><Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}><Box sx={{ position: 'relative', display: 'grid', width: 150, height: 150, placeItems: 'center', borderRadius: '50%', background: `conic-gradient(#185f55 0 ${bookingShare}%, #ffb020 ${bookingShare}% ${bookingShare + courtShare}%, #b7f56a ${bookingShare + courtShare}% 100%)` }}><Box sx={{ display: 'grid', width: 108, height: 108, placeItems: 'center', borderRadius: '50%', bgcolor: 'background.paper', textAlign: 'center' }}><Box><Typography color="text.secondary" variant="caption">Total</Typography><Typography sx={{ fontSize: 23, fontWeight: 900 }}>{metrics.reservations + metrics.courts}</Typography></Box></Box></Box></Box><Stack spacing={2}><ProgressRow color="primary" label="Reservas" total={metrics.reservations} value={bookingShare} /><ProgressRow color="warning" label="Canchas" total={metrics.courts} value={courtShare} /><ProgressRow color="secondary" label="Negocios" total={metrics.businesses} value={Math.round((metrics.businesses / totalAssets) * 100)} /></Stack></CardContent></Card>
    </Box>
  </Box>
}

function MetricCard({ label, value, loading, icon, color }: { label: string; value: number; loading: boolean; icon: React.ReactNode; color: 'primary' | 'secondary' | 'warning' | 'info' }) {
  return <Card><CardContent sx={{ p: 2.5 }}><Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}><Box><Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography><Typography sx={{ mt: 1, fontSize: 27, fontWeight: 900 }}>{loading ? <CircularProgress size={22} /> : value.toLocaleString('es-CO')}</Typography></Box><Box sx={{ display: 'grid', width: 42, height: 42, placeItems: 'center', borderRadius: 1, bgcolor: `${color}.50`, color: `${color}.main` }}>{icon}</Box></Stack></CardContent></Card>
}
function Legend({ color, label }: { color: string; label: string }) { return <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} /><Typography color="text.secondary" variant="caption">{label}</Typography></Stack> }
function ProgressRow({ label, total, value, color }: { label: string; total: number; value: number; color: 'primary' | 'secondary' | 'warning' }) { return <Box><Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}><Typography variant="body2">{label}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">{total.toLocaleString('es-CO')}</Typography></Stack><LinearProgress color={color} value={Math.min(value, 100)} variant="determinate" /></Box> }
