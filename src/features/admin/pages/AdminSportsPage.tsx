import { useEffect, useMemo, type FormEvent } from 'react'
import { MenuItem, Select, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { ResponsiveModalForm } from '../../../components/ResponsiveModalForm'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { RowActionsMenu } from '../../../shared/components/RowActionsMenu'
import { AppButton, AppInput } from '../../../shared/components/MuiPrimitives'
import { useAdminSportsStore, type SportForm } from '../../../stores/admin/useAdminSportsStore'

export function AdminSportsPage() {
  const state = useAdminSportsStore()
  useEffect(() => { void state.load() }, [state.load])
  const categories = useMemo(() => Array.from(new Set(state.sports.map((item) => item.categoria).filter((item): item is string => Boolean(item)))).sort(), [state.sports])
  const filtered = useMemo(() => {
    const term = state.search.trim().toLocaleLowerCase('es')
    return state.sports.filter((sport) => (state.statusFilter === 'all' || sport.activo === (state.statusFilter === 'active')) && (state.categoryFilter === 'all' || sport.categoria === state.categoryFilter) && (!term || `${sport.nombre} ${sport.slug} ${sport.categoria ?? ''}`.toLocaleLowerCase('es').includes(term)))
  }, [state.categoryFilter, state.search, state.sports, state.statusFilter])
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void state.save() }

  return (
    <main className="page-container">
      <ModuleHeader title="Deportes" />
      <Stack spacing={1.25} sx={{ mb: 2 }}><FeedbackAlert message={!state.open ? state.error : ''} /><FeedbackAlert message={state.message} severity="success" /></Stack>
      <AdminTableShell
        title="Catálogo deportivo"
        filters={<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: '100%' }}><AppInput className="field" placeholder="Buscar nombre, slug o categoría" type="search" value={state.search} onChange={(event) => state.setSearch(event.target.value)} /><Select onChange={(event) => state.setCategoryFilter(event.target.value)} size="small" value={state.categoryFilter} sx={{ minWidth: 170 }}><MenuItem value="all">Todas las categorías</MenuItem>{categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select><Select onChange={(event) => state.setStatusFilter(event.target.value as typeof state.statusFilter)} size="small" value={state.statusFilter} sx={{ minWidth: 150 }}><MenuItem value="all">Todos</MenuItem><MenuItem value="active">Activos</MenuItem><MenuItem value="inactive">Inactivos</MenuItem></Select></Stack>}
        actions={<AppButton className="primary-button" type="button" onClick={state.create}>Nuevo deporte</AppButton>}
      >
        <TableContainer><Table aria-label="Deportes" sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Deporte</TableCell><TableCell>Categoría</TableCell><TableCell>Jugadores</TableCell><TableCell>Estado</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead><TableBody>{filtered.map((sport) => <TableRow hover key={sport.id}><TableCell><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{sport.nombre}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{sport.slug}</Typography></TableCell><TableCell>{sport.categoria || 'Sin categoría'}</TableCell><TableCell>{sport.jugadores_por_equipo ?? 'No aplica'}</TableCell><TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><Switch checked={sport.activo} onChange={() => void state.toggle(sport)} size="small" slotProps={{ input: { 'aria-label': sport.activo ? 'Desactivar deporte' : 'Activar deporte' } }} /><Typography color="text.secondary" sx={{ fontSize: 12 }}>{sport.activo ? 'Activo' : 'Inactivo'}</Typography></Stack></TableCell><TableCell align="center"><RowActionsMenu rowId={`sport-${sport.id}`} actions={[{ label: 'Editar', onClick: () => state.edit(sport) }, { label: 'Eliminar', destructive: true, onClick: () => { if (window.confirm(`Eliminar ${sport.nombre}?`)) void state.remove(sport) } }]} /></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell align="center" colSpan={5} sx={{ py: 6 }}>No hay deportes para este filtro.</TableCell></TableRow>}</TableBody></Table></TableContainer>
      </AdminTableShell>

      {state.open && <ResponsiveModalForm title={state.editing ? 'Editar deporte' : 'Nuevo deporte'} kicker="Deporte" size="sm" onClose={state.close} onSubmit={submit} actions={<><AppButton className="secondary-button" type="button" onClick={state.close}>Cancelar</AppButton><AppButton className="primary-button" disabled={state.saving}>{state.saving ? 'Guardando...' : 'Guardar deporte'}</AppButton></>}><Stack spacing={2}><Field label="Nombre"><AppInput className="field" required value={state.form.name} onChange={(event) => state.setName(event.target.value)} /></Field><SportInput field="slug" label="Slug" form={state.form} setField={state.setField} /><SportInput field="category" label="Categoría" form={state.form} setField={state.setField} /><SportInput field="players" label="Jugadores por equipo" form={state.form} setField={state.setField} type="number" /><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><AppInput checked={state.form.active} type="checkbox" onChange={(event) => state.setField('active', event.target.checked)} /><Typography sx={{ fontSize: 14, fontWeight: 700 }}>Deporte activo</Typography></Stack><FeedbackAlert message={state.error} /></Stack></ResponsiveModalForm>}
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Stack spacing={0.75}><Typography component="label" sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography>{children}</Stack>
}

function SportInput({ field, label, form, setField, type = 'text' }: { field: 'slug' | 'category' | 'players'; label: string; form: SportForm; setField: <K extends keyof SportForm>(field: K, value: SportForm[K]) => void; type?: string }) {
  return <Field label={label}><AppInput className="field" type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} /></Field>
}
