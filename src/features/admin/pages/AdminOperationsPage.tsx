import { useEffect, useMemo } from 'react'
import { Box, Card, CardContent, Chip, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import type { BookingStatus } from '../../../services/supabase/tables'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { AppInput } from '../../../shared/components/MuiPrimitives'
import { formatMinorMoney } from '../../../shared/lib/money'
import { getProviderLabel } from '../../../services/payments/paymentProvider'
import { useAdminOperationsStore } from '../../../stores/admin/useAdminOperationsStore'

const bookingStates: BookingStatus[] = ['pendiente_pago', 'confirmada', 'cancelada', 'expirada', 'reembolsada']
const paymentStates = ['pending', 'paid', 'failed', 'refunded']

export function AdminOperationsPage() {
  const tab = useAdminOperationsStore((state) => state.tab)
  const reservations = useAdminOperationsStore((state) => state.reservations)
  const payments = useAdminOperationsStore((state) => state.payments)
  const search = useAdminOperationsStore((state) => state.search)
  const status = useAdminOperationsStore((state) => state.status)
  const error = useAdminOperationsStore((state) => state.error)
  const message = useAdminOperationsStore((state) => state.message)
  const busyId = useAdminOperationsStore((state) => state.busyId)
  const load = useAdminOperationsStore((state) => state.load)
  const setTab = useAdminOperationsStore((state) => state.setTab)
  const setSearch = useAdminOperationsStore((state) => state.setSearch)
  const setStatus = useAdminOperationsStore((state) => state.setStatus)
  const updateReservationStatus = useAdminOperationsStore((state) => state.updateReservationStatus)

  useEffect(() => { void load() }, [load])

  const filteredReservations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return reservations.filter((item) => (status === 'all' || item.estado_reserva === status) && (!term || `${item.referencia_publica} ${item.nombre_cliente} ${item.telefono_cliente} ${item.negocios?.nombre ?? ''} ${item.canchas?.nombre ?? ''}`.toLocaleLowerCase('es').includes(term)))
  }, [reservations, search, status])

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return payments.filter((item) => (status === 'all' || item.estado === status) && (!term || `${item.id} ${item.payment_provider ?? ''} ${item.provider_payment_id ?? item.stripe_payment_intent_id ?? ''} ${item.provider_checkout_id ?? item.stripe_checkout_session_id ?? ''} ${item.provider_reference ?? ''} ${item.negocios?.nombre ?? ''}`.toLocaleLowerCase('es').includes(term)))
  }, [payments, search, status])

  const totals = useMemo(() => filteredPayments.reduce((value, item) => ({ gross: value.gross + item.monto_total_minor, fees: value.fees + item.comision_plataforma_minor, net: value.net + item.neto_negocio_minor }), { gross: 0, fees: 0, net: 0 }), [filteredPayments])
  const currency = filteredPayments[0]?.moneda ?? 'COP'

  return (
    <main className="page-container">
      <ModuleHeader title="Operaciones" />
      <Stack spacing={1.25} sx={{ mb: 2 }}><FeedbackAlert message={error} /><FeedbackAlert message={message} severity="success" /></Stack>

      {tab === 'payments' && <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, mb: 2.5 }}><Metric label="Volumen filtrado" value={formatMinorMoney(totals.gross, currency)} /><Metric label="Comision plataforma" value={formatMinorMoney(totals.fees, currency)} /><Metric label="Neto clubes" value={formatMinorMoney(totals.net, currency)} /></Box>}

      <AdminTableShell
        title={tab === 'reservations' ? 'Reservas globales' : 'Conciliacion de pagos'}
        filters={<Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}><ToggleButtonGroup exclusive onChange={(_, value) => value && setTab(value)} size="small" value={tab} sx={{ bgcolor: 'action.hover', p: 0.25, '& .MuiToggleButton-root': { border: 0, px: 2, textTransform: 'none' }, '& .Mui-selected': { bgcolor: 'primary.main !important', color: 'primary.contrastText !important' } }}><ToggleButton value="reservations">Reservas</ToggleButton><ToggleButton value="payments">Pagos</ToggleButton></ToggleButtonGroup><AppInput className="field" placeholder={tab === 'reservations' ? 'Referencia, cliente, club o cancha' : 'ID de pago, proveedor, referencia o club'} type="search" value={search} onChange={(event) => setSearch(event.target.value)} /><Select onChange={(event) => setStatus(event.target.value)} size="small" value={status} sx={{ minWidth: 190 }}><MenuItem value="all">Todos los estados</MenuItem>{(tab === 'reservations' ? bookingStates : paymentStates).map((item) => <MenuItem key={item} value={item}>{item.replaceAll('_', ' ')}</MenuItem>)}</Select></Stack>}
      >
        <TableContainer>
          {tab === 'reservations' ? <ReservationsTable busyId={busyId} rows={filteredReservations} onStatusChange={updateReservationStatus} /> : <PaymentsTable rows={filteredPayments} />}
        </TableContainer>
        <Box sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1.5 }}><Typography color="text.secondary" sx={{ fontSize: 13 }}>Mostrando {tab === 'reservations' ? filteredReservations.length : filteredPayments.length} registros.</Typography></Box>
      </AdminTableShell>
    </main>
  )
}

function ReservationsTable({ rows, busyId, onStatusChange }: { rows: ReturnType<typeof useAdminOperationsStore.getState>['reservations']; busyId: string; onStatusChange: ReturnType<typeof useAdminOperationsStore.getState>['updateReservationStatus'] }) {
  return <Table aria-label="Reservas globales" sx={{ minWidth: 980 }}><TableHead><TableRow><TableCell>Reserva</TableCell><TableCell>Club / cancha</TableCell><TableCell>Fecha</TableCell><TableCell>Total</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{rows.map((item) => <TableRow hover key={item.id}><TableCell><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.nombre_cliente}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{item.referencia_publica} - {item.telefono_cliente}</Typography></TableCell><TableCell><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.negocios?.nombre}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{item.canchas?.nombre}</Typography></TableCell><TableCell><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.fecha_local}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{item.hora_inicio_local.slice(0, 5)} - {item.hora_fin_local.slice(0, 5)}</Typography></TableCell><TableCell sx={{ fontWeight: 800 }}>{formatMinorMoney(item.precio_total_minor, item.moneda)}</TableCell><TableCell><Select disabled={busyId === item.id} onChange={(event) => void onStatusChange(item, event.target.value as BookingStatus)} size="small" value={item.estado_reserva} sx={{ minWidth: 170 }}>{bookingStates.map((state) => <MenuItem key={state} value={state}>{state.replaceAll('_', ' ')}</MenuItem>)}</Select></TableCell></TableRow>)}</TableBody></Table>
}

function PaymentsTable({ rows }: { rows: ReturnType<typeof useAdminOperationsStore.getState>['payments'] }) {
  return <Table aria-label="Pagos" sx={{ minWidth: 1080 }}><TableHead><TableRow><TableCell>Pago</TableCell><TableCell>Club</TableCell><TableCell>Distribucion</TableCell><TableCell>Estado</TableCell><TableCell>Proveedor</TableCell></TableRow></TableHead><TableBody>{rows.map((item) => <TableRow hover key={item.id}><TableCell><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.tipo_pago}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{new Date(item.creado_en).toLocaleString('es-CO')}</Typography></TableCell><TableCell sx={{ fontWeight: 700 }}>{item.negocios?.nombre}</TableCell><TableCell><Typography sx={{ fontSize: 14, fontWeight: 800 }}>{formatMinorMoney(item.monto_total_minor, item.moneda)}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>Comision {formatMinorMoney(item.comision_plataforma_minor, item.moneda)} - Neto {formatMinorMoney(item.neto_negocio_minor, item.moneda)}</Typography></TableCell><TableCell><Chip color={item.estado === 'paid' ? 'success' : item.estado === 'failed' ? 'error' : 'default'} label={item.estado} size="small" /></TableCell><TableCell><Typography sx={{ fontSize: 13, fontWeight: 800, maxWidth: 230 }} noWrap>{getProviderLabel(item.payment_provider)}</Typography><Typography color="text.secondary" sx={{ fontSize: 12, maxWidth: 230 }} noWrap>{item.provider_payment_id ?? item.stripe_payment_intent_id ?? 'Sin ID de pago'}</Typography><Typography color="text.secondary" sx={{ fontSize: 12, maxWidth: 230 }} noWrap>{item.provider_checkout_id ?? item.stripe_checkout_session_id ?? item.provider_reference ?? 'Sin checkout'}</Typography></TableCell></TableRow>)}</TableBody></Table>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card sx={{ border: 1, borderColor: 'divider' }}><CardContent><Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ fontSize: 23, fontWeight: 800, mt: 1 }}>{value}</Typography></CardContent></Card>
}
