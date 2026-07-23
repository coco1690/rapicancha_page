import { AppButton, AppInput, AppSelect } from '../../../shared/components/MuiPrimitives'
import { useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { ResponsiveModalForm } from '../../../components/ResponsiveModalForm'
import { formatMinorMoney, moneyInputStep } from '../../../shared/lib/money'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useBusinessStore, type CourtForm } from '../../../stores/useBusinessStore'

export function CourtsPage() {
  const user = useAuthStore((state) => state.user)
  const business = useBusinessStore((state) => state.business)
  const plan = useBusinessStore((state) => state.plan)
  const courts = useBusinessStore((state) => state.courts)
  const sports = useBusinessStore((state) => state.sports)
  const form = useBusinessStore((state) => state.courtForm)
  const editing = useBusinessStore((state) => state.editingCourt)
  const open = useBusinessStore((state) => state.courtFormOpen)
  const saving = useBusinessStore((state) => state.saving)
  const busyId = useBusinessStore((state) => state.busyId)
  const error = useBusinessStore((state) => state.error)
  const loadCatalogs = useBusinessStore((state) => state.loadCatalogs)
  const openCreate = useBusinessStore((state) => state.openCourtCreate)
  const openEdit = useBusinessStore((state) => state.openCourtEdit)
  const close = useBusinessStore((state) => state.closeCourtForm)
  const setField = useBusinessStore((state) => state.setCourtField)
  const save = useBusinessStore((state) => state.saveCourt)
  const toggle = useBusinessStore((state) => state.toggleCourt)

  useEffect(() => { if (sports.length === 0) void loadCatalogs() }, [loadCatalogs, sports.length])

  if (!business) return <main className="page-container"><Typography component="h1" variant="h1">Canchas</Typography><Typography color="text.secondary" sx={{ mt: 1.5 }}>Primero debes crear el perfil del negocio.</Typography><AppButton className="primary-button mt-6 inline-flex" type="button" onClick={() => { window.location.href = '/negocio/perfil' }}>Configurar negocio</AppButton></main>

  const atLimit = Boolean(plan && courts.length >= plan.limite_canchas)
  const inactiveBusiness = business.estado !== 'activo'
  const missingPlan = !plan
  const missingSports = sports.length === 0
  const creationBlocked = inactiveBusiness || missingPlan || missingSports || atLimit
  const blockerMessage = inactiveBusiness ? 'El negocio debe estar activo para registrar canchas.' : missingPlan ? 'El negocio no tiene un plan activo asignado.' : missingSports ? 'No hay deportes activos disponibles para crear canchas.' : atLimit ? 'Alcanzaste el limite del plan.' : ''
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (user) void save(user.id) }

  return <main className="page-container">
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', gap: 2 }}>
      <Box>
        <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Inventario</Typography>
        <Typography component="h1" variant="h1">Canchas</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{courts.length} de {plan?.limite_canchas ?? '-'} disponibles en {plan?.nombre ?? 'tu plan'}.</Typography>
      </Box>
      <AppButton className="primary-button" disabled={creationBlocked} onClick={openCreate} type="button">Nueva cancha</AppButton>
    </Stack>

    {blockerMessage && <Alert severity="warning" sx={{ mt: 2 }}>{blockerMessage}</Alert>}
    {error && !open && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, mt: 3 }}>
      {courts.map((court) => <Card key={court.id}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography color="primary" sx={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>{court.deportes?.nombre ?? 'Deporte'}</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 19, fontWeight: 950 }}>{court.nombre}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{court.superficie || 'Superficie sin definir'} · Capacidad {court.capacidad_jugadores ?? '-'}</Typography>
            </Box>
            <Chip color={court.estado === 'activa' && court.activa ? 'success' : 'default'} label={court.estado} size="small" />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-end' }, borderTop: 1, borderColor: 'divider', gap: 2, justifyContent: 'space-between', mt: 2.5, pt: 2.5 }}>
            <Box><Typography color="text.secondary" sx={{ fontSize: 12 }}>Precio por hora</Typography><Typography sx={{ fontWeight: 950 }}>{formatMinorMoney(court.precio_por_hora_minor, business.moneda_codigo ?? business.moneda)}</Typography></Box>
            <Stack direction="row" spacing={1}>
              <AppButton className="secondary-button" onClick={() => openEdit(court)} type="button">Editar</AppButton>
              <AppButton className="secondary-button" disabled={busyId === court.id} onClick={() => user && void toggle(court, user.id)} type="button">{court.estado === 'activa' && court.activa ? 'Desactivar' : 'Activar'}</AppButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>)}
    </Box>

    {open && <ResponsiveModalForm title={editing ? 'Editar cancha' : 'Nueva cancha'} kicker="Inventario" onClose={close} onSubmit={submit} actions={<><AppButton className="secondary-button" type="button" onClick={close}>Cancelar</AppButton><AppButton className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cancha'}</AppButton></>}>
      <div className="responsive-modal-grid">
        <CourtInput field="name" label="Nombre" form={form} setField={setField} required />
        <CourtField label="Deporte"><AppSelect className="field" required value={form.sportId} onChange={(event) => setField('sportId', event.target.value)}><option value="">Seleccionar</option>{sports.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</AppSelect></CourtField>
        <CourtField label={`Precio por hora (${business.moneda_codigo ?? business.moneda})`}><AppInput className="field" required min="0" step={moneyInputStep(business.moneda_codigo ?? business.moneda)} type="number" value={form.price} onChange={(event) => setField('price', event.target.value)} /></CourtField>
        <CourtInput field="capacity" label="Capacidad" form={form} setField={setField} type="number" />
        <CourtInput field="surface" label="Superficie" form={form} setField={setField} />
        <CourtInput field="description" label="Descripcion" form={form} setField={setField} />
      </div>
      <div className="mt-5 flex flex-wrap gap-6 border-y border-zinc-200 py-4">
        <label className="flex items-center gap-2 text-sm font-semibold"><AppInput checked={form.covered} type="checkbox" onChange={(event) => setField('covered', event.target.checked)} /> Cancha cubierta</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><AppInput checked={form.lighting} type="checkbox" onChange={(event) => setField('lighting', event.target.checked)} /> Tiene iluminacion</label>
      </div>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </ResponsiveModalForm>}
  </main>
}

function CourtField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="min-w-0 text-sm font-semibold text-zinc-700">{label}<span className="mt-1.5 block">{children}</span></label> }
function CourtInput({ field, label, form, setField, type = 'text', required = false }: { field: 'name' | 'capacity' | 'surface' | 'description'; label: string; form: CourtForm; setField: <K extends keyof CourtForm>(field: K, value: CourtForm[K]) => void; type?: string; required?: boolean }) { return <CourtField label={label}><AppInput className="field" required={required} type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} /></CourtField> }
