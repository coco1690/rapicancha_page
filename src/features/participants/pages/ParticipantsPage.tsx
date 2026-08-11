import { useEffect, useMemo } from 'react'
import { DownloadOutlined, EmailOutlined, GroupsOutlined, WhatsApp } from '@mui/icons-material'
import { Avatar, Box, Button, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { AppInput } from '../../../shared/components/MuiPrimitives'
import { RowActionsMenu } from '../../../shared/components/RowActionsMenu'
import { useBusinessStore } from '../../../stores/useBusinessStore'
import { useParticipantsStore, type ParticipantChannelFilter } from '../../../stores/useParticipantsStore'

const filters: Array<{ value: ParticipantChannelFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'email', label: 'Correo autorizado' },
  { value: 'whatsapp', label: 'WhatsApp autorizado' },
]

export function ParticipantsPage({ scope }: { scope: 'business' | 'admin' }) {
  const businessId = useBusinessStore((state) => state.business?.id)
  const rows = useParticipantsStore((state) => state.rows)
  const search = useParticipantsStore((state) => state.search)
  const channelFilter = useParticipantsStore((state) => state.channelFilter)
  const page = useParticipantsStore((state) => state.page)
  const rowsPerPage = useParticipantsStore((state) => state.rowsPerPage)
  const loading = useParticipantsStore((state) => state.loading)
  const error = useParticipantsStore((state) => state.error)
  const load = useParticipantsStore((state) => state.load)
  const subscribe = useParticipantsStore((state) => state.subscribe)
  const setSearch = useParticipantsStore((state) => state.setSearch)
  const setChannelFilter = useParticipantsStore((state) => state.setChannelFilter)
  const setPage = useParticipantsStore((state) => state.setPage)
  const setRowsPerPage = useParticipantsStore((state) => state.setRowsPerPage)
  const exportRows = useParticipantsStore((state) => state.exportRows)
  const clear = useParticipantsStore((state) => state.clear)
  const contextBusinessId = scope === 'business' ? businessId : undefined

  useEffect(() => {
    if (scope === 'business' && !contextBusinessId) return undefined
    void load(contextBusinessId)
    return subscribe(contextBusinessId)
  }, [contextBusinessId, load, scope, subscribe])
  useEffect(() => clear, [clear])

  const filteredRows = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLocaleLowerCase('es')
    const matchesSearch = !query || `${row.firstName} ${row.lastName} ${row.email} ${row.phone} ${row.businessName} ${row.eventNames.join(' ')}`.toLocaleLowerCase('es').includes(query)
    const matchesChannel = channelFilter === 'all' || (channelFilter === 'email' ? row.acceptsEmail : row.acceptsWhatsApp)
    return matchesSearch && matchesChannel
  }), [channelFilter, rows, search])
  const visibleRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const exportableRows = filteredRows.filter((row) => row.acceptsEmail || row.acceptsWhatsApp)

  return <main className="page-container">
    <ModuleHeader title="Participantes" />
    <FeedbackAlert message={error} />
    <AdminTableShell
      title="Directorio de participantes"
      filters={<Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: { xs: '100%', lg: 'auto' } }}><ToggleButtonGroup exclusive onChange={(_, value: ParticipantChannelFilter | null) => value && setChannelFilter(value)} size="small" value={channelFilter} sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 0.25, '& .MuiToggleButton-root': { border: 0, borderRadius: 1, px: { xs: 1, sm: 1.75 }, textTransform: 'none' }, '& .Mui-selected': { bgcolor: 'primary.main !important', color: 'primary.contrastText !important' } }}>{filters.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}</ToggleButtonGroup><AppInput aria-label="Buscar participantes" className="field" placeholder="Buscar participante, evento o club" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Stack>}
      actions={<Button disabled={!exportableRows.length} onClick={() => exportRows(exportableRows)} startIcon={<DownloadOutlined />} variant="outlined">Exportar autorizados</Button>}
    >
      <TableContainer><Table aria-label="Participantes de eventos" sx={{ minWidth: scope === 'admin' ? 1050 : 900 }}>
        <TableHead><TableRow><TableCell>Participante</TableCell>{scope === 'admin' && <TableCell>Club</TableCell>}<TableCell>Contacto</TableCell><TableCell>Autorizaciones</TableCell><TableCell>Último evento</TableCell><TableCell>Inscripciones</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
        <TableBody>
          {visibleRows.map((row) => <TableRow hover key={row.id}>
            <TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Avatar sx={{ bgcolor: 'secondary.light', color: 'primary.dark', fontSize: 13, fontWeight: 900, height: 36, width: 36 }}>{`${row.firstName[0] ?? ''}${row.lastName[0] ?? ''}`.toUpperCase()}</Avatar><Box><Typography sx={{ fontSize: 14, fontWeight: 800 }}>{row.firstName} {row.lastName}</Typography><Typography color="text.secondary" variant="caption">Registrado {formatDate(row.lastRegistrationAt)}</Typography></Box></Stack></TableCell>
            {scope === 'admin' && <TableCell><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.businessName}</Typography></TableCell>}
            <TableCell><Typography sx={{ fontSize: 13 }}>{row.email}</Typography><Typography color="text.secondary" variant="caption">{row.phone}</Typography></TableCell>
            <TableCell><Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}><Chip color={row.acceptsEmail ? 'success' : 'default'} label="Correo" size="small" variant={row.acceptsEmail ? 'filled' : 'outlined'} /><Chip color={row.acceptsWhatsApp ? 'success' : 'default'} label="WhatsApp" size="small" variant={row.acceptsWhatsApp ? 'filled' : 'outlined'} /></Stack></TableCell>
            <TableCell><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.eventNames[0] ?? 'Sin evento'}</Typography>{row.eventNames.length > 1 && <Typography color="text.secondary" variant="caption">+{row.eventNames.length - 1} eventos</Typography>}</TableCell>
            <TableCell><Chip label={row.registrations} size="small" /></TableCell>
            <TableCell align="right"><RowActionsMenu rowId={`participant-${row.id}`} actions={[{ label: 'Enviar correo', icon: <EmailOutlined fontSize="small" />, disabled: !row.acceptsEmail, onClick: () => openEmail(row) }, { label: 'Abrir WhatsApp', icon: <WhatsApp fontSize="small" />, disabled: !row.acceptsWhatsApp, onClick: () => openWhatsApp(row) }]} /></TableCell>
          </TableRow>)}
          {!visibleRows.length && <TableRow><TableCell colSpan={scope === 'admin' ? 7 : 6}><Stack spacing={1} sx={{ alignItems: 'center', py: 6 }}>{loading ? <CircularProgress size={28} /> : <GroupsOutlined color="disabled" />}<Typography color="text.secondary">{loading ? 'Actualizando participantes...' : 'No hay participantes para este filtro.'}</Typography></Stack></TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <TablePagination component="div" count={filteredRows.length} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} labelRowsPerPage="Filas por página:" onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25, 50]} />
    </AdminTableShell>
  </main>
}

function formatDate(value: string) { return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value)) }
function openEmail(row: { email: string; firstName: string; businessName: string }) {
  const subject = encodeURIComponent(`Próximo evento de ${row.businessName}`)
  const body = encodeURIComponent(`Hola ${row.firstName},\n\nQueremos compartirte nuestro próximo evento deportivo.`)
  window.location.href = `mailto:${row.email}?subject=${subject}&body=${body}`
}
function openWhatsApp(row: { phone: string; firstName: string; businessName: string }) {
  const message = encodeURIComponent(`Hola ${row.firstName}, queremos compartirte un próximo evento deportivo de ${row.businessName}.`)
  window.open(`https://wa.me/${row.phone.replace(/\D/g, '')}?text=${message}`, '_blank', 'noopener,noreferrer')
}
