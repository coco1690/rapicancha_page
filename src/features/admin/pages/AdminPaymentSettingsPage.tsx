import { useEffect } from 'react'
import { PercentOutlined, SaveOutlined } from '@mui/icons-material'
import { Box, Button, InputAdornment, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { LoadingScreen } from '../../../shared/components/LoadingScreen'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { formatMinorMoney } from '../../../shared/lib/money'
import { labelFor, useAdminPaymentSettingsStore } from '../../../stores/admin/useAdminPaymentSettingsStore'

export function AdminPaymentSettingsPage() {
  const state = useAdminPaymentSettingsStore()
  useEffect(() => { void state.load() }, [state.load])
  if (state.loading && state.commissions.length === 0) return <LoadingScreen label="Cargando comisiones..." />

  return <main className="page-container">
    <ModuleHeader title="Comisiones" section="Finanzas" />
    <Stack spacing={1.25} sx={{ mb: 2 }}><FeedbackAlert message={state.error} /><FeedbackAlert message={state.message} severity="success" /></Stack>
    <Box sx={{ mb: 2.5, maxWidth: 760 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 900 }}>Porcentajes de Rapicancha</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>Se aplican únicamente a compras nuevas. El cargo de la pasarela se calcula por separado y cada transacción conserva sus porcentajes históricos.</Typography>
    </Box>
    <AdminTableShell title="Configuración por operación">
      <TableContainer>
        <Table aria-label="Comisiones de Rapicancha" sx={{ minWidth: 760 }}>
          <TableHead><TableRow><TableCell>Operación</TableCell><TableCell>Porcentaje</TableCell><TableCell>Ejemplo sobre $100.000</TableCell><TableCell align="center">Activa</TableCell><TableCell align="right">Acción</TableCell></TableRow></TableHead>
          <TableBody>{state.commissions.map((item) => {
            const percentage = Number((state.values[item.id] ?? '0').replace(',', '.')) || 0
            const busy = state.savingId === item.id
            return <TableRow hover key={item.id}>
              <TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Box sx={{ bgcolor: 'secondary.light', borderRadius: 1, color: 'primary.dark', display: 'grid', height: 38, placeItems: 'center', width: 38 }}><PercentOutlined fontSize="small" /></Box><Box><Typography sx={{ fontWeight: 900, textTransform: 'capitalize' }}>{labelFor(item.tipo_pago)}</Typography><Typography color="text.secondary" variant="caption">{item.descripcion}</Typography></Box></Stack></TableCell>
              <TableCell><TextField disabled={busy || !item.activa} onChange={(event) => state.setValue(item.id, event.target.value)} size="small" slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 }, input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} type="number" value={state.values[item.id] ?? ''} sx={{ width: 140 }} /></TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{formatMinorMoney(Math.round(100000 * percentage / 100), 'COP')}</TableCell>
              <TableCell align="center"><Switch checked={item.activa} disabled={busy} onChange={(event) => void state.toggle(item, event.target.checked)} /></TableCell>
              <TableCell align="right"><Button disabled={busy || !item.activa} onClick={() => void state.save(item)} startIcon={<SaveOutlined />} variant="contained">{busy ? 'Guardando...' : 'Guardar'}</Button></TableCell>
            </TableRow>
          })}</TableBody>
        </Table>
      </TableContainer>
    </AdminTableShell>
  </main>
}
