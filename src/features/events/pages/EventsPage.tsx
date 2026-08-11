import { useEffect, type FormEvent } from 'react'
import { AddOutlined, CategoryOutlined, DeleteOutlined, EditOutlined, OpenInNewOutlined, PeopleOutlined, RouteOutlined } from '@mui/icons-material'
import {
  Alert, Box, Button, Chip, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack,
  Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { ResponsiveModalForm } from '../../../components/ResponsiveModalForm'
import { useBusinessStore } from '../../../stores/useBusinessStore'
import { useEventsStore, type CategoryForm, type EventForm, type EventScope, type ModalityForm } from '../../../stores/useEventsStore'
import type { Evento, EventoEstado } from '../../../services/supabase/tables'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { RowActionsMenu } from '../../../shared/components/RowActionsMenu'
import { LoadingScreen } from '../../../shared/components/LoadingScreen'
import { moneyInputStep } from '../../../shared/lib/money'

const states: Array<{ value: EventoEstado; label: string }> = [
  { value: 'borrador', label: 'Borrador' }, { value: 'publicado', label: 'Publicado' },
  { value: 'en_curso', label: 'En curso' }, { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]
const statusLabel = (value: EventoEstado) => states.find((item) => item.value === value)?.label ?? value
const statusColor = (value: EventoEstado): 'default' | 'success' | 'warning' | 'info' | 'error' => value === 'publicado' ? 'success' : value === 'en_curso' ? 'info' : value === 'cancelado' ? 'error' : value === 'finalizado' ? 'default' : 'warning'
const formatDate = (event: Evento) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: event.zona_horaria }).format(new Date(event.inicio_at))

export function EventsPage({ scope }: { scope: EventScope }) {
  const business = useBusinessStore((state) => state.business)
  const s = useEventsStore()
  const businessId = scope === 'business' ? business?.id : undefined

  useEffect(() => {
    if (scope === 'business' && !businessId) return
    void s.load(scope, businessId)
  }, [businessId, scope, s.load])

  if (s.loading && s.events.length === 0) return <LoadingScreen label="Cargando eventos..." />
  if (scope === 'business' && !business) return <Box className="page-container"><Alert severity="warning">Configura primero el perfil del club.</Alert></Box>

  const normalizedSearch = s.search.trim().toLocaleLowerCase('es')
  const visibleEvents = s.events.filter((event) => {
    const sport = s.sports.find((item) => item.id === event.deporte_id)?.nombre ?? ''
    const owner = s.businesses.find((item) => item.id === event.negocio_id)?.nombre ?? ''
    return `${event.nombre} ${sport} ${owner} ${event.estado}`.toLocaleLowerCase('es').includes(normalizedSearch)
  })
  const currentPlan = scope === 'business' ? s.plans.find((item) => item.id === business?.plan_id) : null
  const activeEvents = s.events.filter((item) => !['finalizado', 'cancelado'].includes(item.estado)).length
  const creationBlocked = scope === 'business' && (!currentPlan?.eventos_habilitados || (currentPlan.limite_eventos !== null && activeEvents >= currentPlan.limite_eventos))

  const deleteEvent = (event: Evento) => {
    if (window.confirm(`Eliminar el evento "${event.nombre}"?`)) void s.removeEvent(event)
  }
  const eventActions = (event: Evento) => {
    const businessSlug = s.businesses.find((item) => item.id === event.negocio_id)?.slug
    return [
      ...(event.es_publico && event.estado === 'publicado' && businessSlug ? [{ label: 'Ver página pública', icon: <OpenInNewOutlined fontSize="small" />, onClick: () => window.open(`/eventos/${businessSlug}/${event.slug}`, '_blank', 'noopener,noreferrer') }] : []),
      { label: 'Inscripciones', icon: <PeopleOutlined fontSize="small" />, onClick: () => s.openRegistrations(event) },
      { label: 'Editar', onClick: () => s.openEventEdit(event) },
      { label: 'Modalidades', icon: <RouteOutlined fontSize="small" />, onClick: () => s.openModalities(event) },
      { label: 'Categorias', icon: <CategoryOutlined fontSize="small" />, onClick: () => s.openCategories(event) },
      { label: 'Eliminar', destructive: true, onClick: () => deleteEvent(event) },
    ]
  }

  return <Box component="main" className="page-container">
    {scope === 'admin'
      ? <ModuleHeader section="Gestion" title="Eventos deportivos" />
      : <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: 3 }}><Box><Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Experiencias deportivas</Typography><Typography component="h1" variant="h1">Eventos</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{activeEvents}{currentPlan?.limite_eventos === null ? '' : ` de ${currentPlan?.limite_eventos ?? 0}`} eventos activos.</Typography></Box><Button disabled={creationBlocked} startIcon={<AddOutlined />} variant="contained" onClick={s.openEventCreate}>Nuevo evento</Button></Stack>}

    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <FeedbackAlert message={s.message} severity="success" />
      {!s.eventOpen && !s.modalityEvent && !s.categoryEvent && !s.registrationEvent && <FeedbackAlert message={s.error} />}
      {creationBlocked && <Alert severity="warning">Tu plan no permite crear más eventos activos. Finaliza uno existente o cambia de plan.</Alert>}
    </Stack>

    <AdminTableShell
      title={scope === 'admin' ? 'Eventos de todos los clubes' : 'Agenda de eventos'}
      filters={<TextField fullWidth label="Buscar evento" size="small" value={s.search} onChange={(event) => s.setSearch(event.target.value)} />}
      actions={scope === 'admin' ? <Button disabled={s.businesses.length === 0} startIcon={<AddOutlined />} variant="contained" onClick={s.openEventCreate}>Crear evento</Button> : undefined}
    >
      <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Evento</TableCell>{scope === 'admin' && <TableCell>Club</TableCell>}<TableCell>Deporte</TableCell><TableCell>Inicio</TableCell><TableCell>Modalidades</TableCell><TableCell>Estado</TableCell><TableCell align="center" width={70}>Acciones</TableCell></TableRow></TableHead>
          <TableBody>{visibleEvents.map((event) => {
            const modalityCount = s.modalities.filter((item) => item.evento_id === event.id).length
            return <TableRow hover key={event.id}><TableCell><Typography sx={{ fontWeight: 800 }}>{event.nombre}</Typography><Typography color="text.secondary" variant="caption">/{event.slug}</Typography></TableCell>{scope === 'admin' && <TableCell>{s.businesses.find((item) => item.id === event.negocio_id)?.nombre ?? '-'}</TableCell>}<TableCell>{s.sports.find((item) => item.id === event.deporte_id)?.nombre ?? '-'}</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(event)}</TableCell><TableCell>{modalityCount}</TableCell><TableCell><Chip color={statusColor(event.estado)} label={statusLabel(event.estado)} size="small" variant={event.estado === 'borrador' ? 'outlined' : 'filled'} /></TableCell><TableCell><RowActionsMenu rowId={event.id} actions={eventActions(event)} /></TableCell></TableRow>
          })}</TableBody>
        </Table>
      </Box>
      <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />} sx={{ display: { md: 'none' } }}>
        {visibleEvents.map((event) => <Stack key={event.id} spacing={1.25} sx={{ p: 2 }}><Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}><Box><Typography sx={{ fontWeight: 900 }}>{event.nombre}</Typography><Typography color="text.secondary" variant="body2">{s.sports.find((item) => item.id === event.deporte_id)?.nombre} · {formatDate(event)}</Typography></Box><RowActionsMenu rowId={event.id} actions={eventActions(event)} /></Stack><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip color={statusColor(event.estado)} label={statusLabel(event.estado)} size="small" /><Typography color="text.secondary" variant="caption">{s.modalities.filter((item) => item.evento_id === event.id).length} modalidades</Typography></Stack></Stack>)}
      </Stack>
      {visibleEvents.length === 0 && <Box sx={{ p: 5, textAlign: 'center' }}><Typography sx={{ fontWeight: 800 }}>No hay eventos para mostrar</Typography><Typography color="text.secondary" variant="body2">Crea el primero o cambia la búsqueda.</Typography></Box>}
    </AdminTableShell>

    {s.eventOpen && <EventFormModal scope={scope} />}
    {s.modalityEvent && <ModalityModal />}
    {s.categoryEvent && <CategoryModal />}
    {s.registrationEvent && <RegistrationsModal />}
  </Box>
}

function EventFormModal({ scope }: { scope: EventScope }) {
  const s = useEventsStore(), f = s.eventForm
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void s.saveEvent() }
  return <ResponsiveModalForm title={s.editingEvent ? 'Editar evento' : 'Nuevo evento'} kicker="Evento deportivo" onClose={s.closeEvent} onSubmit={submit} actions={<><Button color="inherit" onClick={s.closeEvent}>Cancelar</Button><Button disabled={s.saving} type="submit" variant="contained">{s.saving ? 'Guardando...' : 'Guardar evento'}</Button></>}>
    <Stack spacing={2.5}>
      {s.error && <Alert severity="error">{s.error}</Alert>}
      <FormGrid>
        {scope === 'admin' && <SelectField label="Club" required value={f.businessId} onChange={s.selectBusiness} options={s.businesses.map((item) => ({ value: item.id, label: item.nombre }))} />}
        <SelectField label="Deporte" required value={f.sportId} onChange={(value) => s.setEventField('sportId', value)} options={s.sports.map((item) => ({ value: item.id, label: item.nombre }))} />
        <InputField label="Nombre" required value={f.name} onChange={(value) => s.setEventField('name', value)} />
        <InputField label="Identificador URL" required value={f.slug} onChange={(value) => s.setEventField('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
        <SelectField label="Ciudad" value={f.cityId} onChange={(value) => s.setEventField('cityId', value)} options={s.cities.map((item) => ({ value: item.id, label: item.nombre }))} emptyLabel="Sin definir" />
        <InputField label="Dirección" value={f.address} onChange={(value) => s.setEventField('address', value)} />
        <InputField label="Inicio" required type="datetime-local" value={f.start} onChange={(value) => s.setEventField('start', value)} />
        <InputField label="Finalización" required type="datetime-local" value={f.end} onChange={(value) => s.setEventField('end', value)} />
        <InputField label="Abren inscripciones" type="datetime-local" value={f.registrationsOpen} onChange={(value) => s.setEventField('registrationsOpen', value)} />
        <InputField label="Cierran inscripciones" type="datetime-local" value={f.registrationsClose} onChange={(value) => s.setEventField('registrationsClose', value)} />
        <InputField label="Capacidad total" min="1" type="number" value={f.capacity} onChange={(value) => s.setEventField('capacity', value)} />
        <SelectField label="Estado" value={f.status} onChange={(value) => s.setEventField('status', value as EventoEstado)} options={states} />
        <InputField label="URL de portada" value={f.coverUrl} onChange={(value) => s.setEventField('coverUrl', value)} />
        <InputField label="URL del reglamento" value={f.rulesUrl} onChange={(value) => s.setEventField('rulesUrl', value)} />
        <Box sx={{ gridColumn: { sm: '1 / -1' } }}><TextField fullWidth label="Descripción" minRows={3} multiline value={f.description} onChange={(event) => s.setEventField('description', event.target.value)} /></Box>
      </FormGrid>
      <Box sx={{ borderBlock: 1, borderColor: 'divider', py: 1.5 }}>
        <Stack spacing={1.5}>
          <FormControlLabel control={<Switch checked={f.requiresBib} onChange={(event) => s.setEventField('requiresBib', event.target.checked)} />} label="Asignar dorsal a participantes pagados" />
          {f.requiresBib && <InputField label={`Primer número de dorsal (ejemplo: ${bibPreview(f.bibStart, f.capacity)})`} min="1" type="number" value={f.bibStart} onChange={(value) => s.setEventField('bibStart', value)} />}
          <FormControlLabel control={<Switch checked={f.requestsShirtSize} onChange={(event) => s.setEventField('requestsShirtSize', event.target.checked)} />} label="Solicitar talla de camiseta" />
        </Stack>
      </Box>
      <Box sx={{ borderBlock: 1, borderColor: 'divider', py: 1 }}><FormControlLabel control={<Switch checked={f.isPublic} onChange={(event) => s.setEventField('isPublic', event.target.checked)} />} label="Visible públicamente cuando esté publicado" /></Box>
    </Stack>
  </ResponsiveModalForm>
}

function ModalityModal() {
  const s = useEventsStore(), event = s.modalityEvent!, f = s.modalityForm
  const items = s.modalities.filter((item) => item.evento_id === event.id)
  const submit = (formEvent: FormEvent<HTMLFormElement>) => { formEvent.preventDefault(); void s.saveModality() }
  return <ResponsiveModalForm title="Modalidades" kicker={event.nombre} onClose={s.closeModalities} onSubmit={submit} actions={<><Button color="inherit" onClick={s.closeModalities}>Cerrar</Button>{s.editingModality && <Button onClick={s.resetModality}>Nueva modalidad</Button>}<Button disabled={s.saving} type="submit" variant="contained">{s.editingModality ? 'Actualizar' : 'Agregar modalidad'}</Button></>}>
    <Stack spacing={2.5}>{s.error && <Alert severity="error">{s.error}</Alert>}<CompactList empty="Aún no hay modalidades.">{items.map((item) => <Stack direction="row" key={item.id} sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25 }}><Box><Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography><Typography color="text.secondary" variant="caption">{item.distancia ? `${item.distancia} ${item.unidad_distancia}` : 'Sin distancia'} · {item.capacidad ?? 'Sin límite'} cupos</Typography></Box><Stack direction="row"><Tooltip title="Editar"><IconButton onClick={() => s.editModality(item)}><EditOutlined /></IconButton></Tooltip><Tooltip title="Eliminar"><IconButton color="error" onClick={() => window.confirm(`Eliminar ${item.nombre}?`) && void s.removeModality(item)}><DeleteOutlined /></IconButton></Tooltip></Stack></Stack>)}</CompactList><Typography component="h3" sx={{ fontWeight: 900 }}>{s.editingModality ? 'Editar modalidad' : 'Nueva modalidad'}</Typography><FormGrid><InputField label="Nombre" required value={f.name} onChange={(value) => s.setModalityField('name', value)} /><InputField label="Identificador" required value={f.slug} onChange={(value) => s.setModalityField('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} /><InputField label="Distancia" min="0" step="0.001" type="number" value={f.distance} onChange={(value) => s.setModalityField('distance', value)} /><InputField label="Unidad" disabled={!f.distance} value={f.distanceUnit} onChange={(value) => s.setModalityField('distanceUnit', value)} /><InputField label="Hora de salida" type="datetime-local" value={f.start} onChange={(value) => s.setModalityField('start', value)} /><InputField label="Cupos" min="1" type="number" value={f.capacity} onChange={(value) => s.setModalityField('capacity', value)} /><InputField label={`Precio (${event.moneda_codigo})`} min="0" step={moneyInputStep(event.moneda_codigo)} type="number" value={f.price} onChange={(value) => s.setModalityField('price', value)} startAdornment="$" /><Box sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel control={<Switch checked={f.active} onChange={(e) => s.setModalityField('active', e.target.checked)} />} label="Modalidad activa" /></Box><Box sx={{ gridColumn: { sm: '1 / -1' } }}><TextField fullWidth label="Descripción" multiline minRows={2} value={f.description} onChange={(e) => s.setModalityField('description', e.target.value)} /></Box></FormGrid></Stack>
  </ResponsiveModalForm>
}

function CategoryModal() {
  const s = useEventsStore(), event = s.categoryEvent!, f = s.categoryForm
  const items = s.categories.filter((item) => item.evento_id === event.id)
  const modalities = s.modalities.filter((item) => item.evento_id === event.id)
  const submit = (formEvent: FormEvent<HTMLFormElement>) => { formEvent.preventDefault(); void s.saveCategory() }
  return <ResponsiveModalForm title="Categorías" kicker={event.nombre} onClose={s.closeCategories} onSubmit={submit} actions={<><Button color="inherit" onClick={s.closeCategories}>Cerrar</Button>{s.editingCategory && <Button onClick={s.resetCategory}>Nueva categoría</Button>}<Button disabled={s.saving} type="submit" variant="contained">{s.editingCategory ? 'Actualizar' : 'Agregar categoría'}</Button></>}>
    <Stack spacing={2.5}>{s.error && <Alert severity="error">{s.error}</Alert>}<CompactList empty="Aún no hay categorías.">{items.map((item) => <Stack direction="row" key={item.id} sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25 }}><Box><Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography><Typography color="text.secondary" variant="caption">{modalities.find((modality) => modality.id === item.modalidad_evento_id)?.nombre ?? 'Todas las modalidades'}{item.nivel ? ` · ${item.nivel}` : ''}</Typography></Box><Stack direction="row"><Tooltip title="Editar"><IconButton onClick={() => s.editCategory(item)}><EditOutlined /></IconButton></Tooltip><Tooltip title="Eliminar"><IconButton color="error" onClick={() => window.confirm(`Eliminar ${item.nombre}?`) && void s.removeCategory(item)}><DeleteOutlined /></IconButton></Tooltip></Stack></Stack>)}</CompactList><Typography component="h3" sx={{ fontWeight: 900 }}>{s.editingCategory ? 'Editar categoría' : 'Nueva categoría'}</Typography><FormGrid><InputField label="Nombre" required value={f.name} onChange={(value) => s.setCategoryField('name', value)} /><SelectField label="Modalidad" value={f.modalityId} onChange={(value) => s.setCategoryField('modalityId', value)} options={modalities.map((item) => ({ value: item.id, label: item.nombre }))} emptyLabel="Todas" /><InputField label="Género o clasificación" value={f.gender} onChange={(value) => s.setCategoryField('gender', value)} /><InputField label="Nivel" value={f.level} onChange={(value) => s.setCategoryField('level', value)} /><InputField label="Edad mínima" min="0" type="number" value={f.minimumAge} onChange={(value) => s.setCategoryField('minimumAge', value)} /><InputField label="Edad máxima" min="0" type="number" value={f.maximumAge} onChange={(value) => s.setCategoryField('maximumAge', value)} /><InputField label="Peso mínimo (kg)" min="0" step="0.01" type="number" value={f.minimumWeight} onChange={(value) => s.setCategoryField('minimumWeight', value)} /><InputField label="Peso máximo (kg)" min="0" step="0.01" type="number" value={f.maximumWeight} onChange={(value) => s.setCategoryField('maximumWeight', value)} /><Box sx={{ display: 'flex', alignItems: 'center' }}><FormControlLabel control={<Switch checked={f.active} onChange={(e) => s.setCategoryField('active', e.target.checked)} />} label="Categoría activa" /></Box></FormGrid></Stack>
  </ResponsiveModalForm>
}

function RegistrationsModal() {
  const s = useEventsStore(), event = s.registrationEvent!
  const items = s.registrations.filter((item) => item.evento_id === event.id)
  const maskDocument = (value: string) => value.length <= 4 ? value : `${'*'.repeat(Math.min(6, value.length - 4))}${value.slice(-4)}`
  return <ResponsiveModalForm title="Inscripciones" kicker={event.nombre} onClose={s.closeRegistrations} onSubmit={(formEvent) => formEvent.preventDefault()} actions={<Button onClick={s.closeRegistrations} variant="contained">Cerrar</Button>}>
    <Stack spacing={2}>
      {s.error && <Alert severity="error">{s.error}</Alert>}
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}><Typography sx={{ fontWeight: 900 }}>Participantes</Typography><Typography color="text.secondary" variant="body2">{items.length} registros</Typography></Stack>
      <Box sx={{ borderBlock: 1, borderColor: 'divider' }}>
        {items.map((item) => <Stack direction={{ xs: 'column', md: 'row' }} key={item.id} spacing={1.5} sx={{ alignItems: { md: 'center' }, borderBottom: 1, borderColor: 'divider', justifyContent: 'space-between', py: 1.5, '&:last-child': { borderBottom: 0 } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 850 }}>{item.participantes ? `${item.participantes.nombres} ${item.participantes.apellidos}` : 'Participante'}</Typography>
            <Typography color="text.secondary" variant="caption">{item.modalidades_evento?.nombre ?? 'Modalidad'}{item.categorias_evento?.nombre ? ` · ${item.categorias_evento.nombre}` : ''} · {item.participantes ? `${item.participantes.tipo_documento} ${maskDocument(item.participantes.numero_documento)}` : ''}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}><Chip label={`Dorsal ${item.numero_dorsal ?? 'sin asignar'}`} size="small" variant="outlined" /><Chip label={`Talla ${item.talla_camiseta ?? 'no aplica'}`} size="small" variant="outlined" /></Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {event.requiere_dorsal && <TextField defaultValue={item.numero_dorsal ?? ''} label="Dorsal" onBlur={(changeEvent) => void s.updateRegistrationBib(item.id, changeEvent.target.value)} size="small" sx={{ width: { sm: 120 } }} />}
            <TextField label="Estado" select size="small" sx={{ minWidth: { sm: 170 } }} value={item.estado} onChange={(changeEvent) => void s.updateRegistrationStatus(item.id, changeEvent.target.value as typeof item.estado)}>{['pendiente_pago', 'pagada', 'confirmada', 'cancelada', 'reembolsada', 'acreditada', 'completada'].map((status) => <MenuItem key={status} value={status}>{status.replaceAll('_', ' ')}</MenuItem>)}</TextField>
          </Stack>
        </Stack>)}
        {items.length === 0 && <Typography color="text.secondary" sx={{ py: 3 }}>Aún no hay inscripciones.</Typography>}
      </Box>
    </Stack>
  </ResponsiveModalForm>
}

function FormGrid({ children }: { children: React.ReactNode }) { return <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>{children}</Box> }
function CompactList({ children, empty }: { children: React.ReactNode; empty: string }) { const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children); return <Box sx={{ borderBlock: 1, borderColor: 'divider', px: 0.5 }}>{hasChildren ? children : <Typography color="text.secondary" sx={{ py: 2 }} variant="body2">{empty}</Typography>}</Box> }
function InputField({ label, value, onChange, type = 'text', required, disabled, min, step, startAdornment }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean; min?: string; step?: string; startAdornment?: string }) {
  const isTemporalField = type === 'date' || type === 'datetime-local' || type === 'time'
  return <TextField disabled={disabled} fullWidth label={label} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} slotProps={{ htmlInput: { min, step }, input: startAdornment ? { startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment> } : undefined, inputLabel: isTemporalField ? { shrink: true } : undefined }} />
}
function SelectField({ label, value, onChange, options, required, emptyLabel }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; required?: boolean; emptyLabel?: string }) { return <TextField fullWidth label={label} required={required} select value={value} onChange={(event) => onChange(event.target.value)}>{emptyLabel !== undefined && <MenuItem value="">{emptyLabel}</MenuItem>}{options.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField> }
function bibPreview(start: string, capacity: string) { const width = capacity ? capacity.replace(/\D/g, '').length : 3; return String(Math.max(1, Number(start) || 1)).padStart(Math.max(width, String(Math.max(1, Number(start) || 1)).length), '0') }

export type { EventForm, ModalityForm, CategoryForm }
