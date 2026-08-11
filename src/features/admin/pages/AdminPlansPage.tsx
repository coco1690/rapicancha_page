import { useEffect, type FormEvent } from 'react'
import { Check, WorkspacePremiumOutlined } from '@mui/icons-material'
import { Box, Card, CardActions, CardContent, Chip, Stack, Switch, Typography } from '@mui/material'
import { ResponsiveModalForm } from '../../../components/ResponsiveModalForm'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { AppButton, AppInput, AppTextArea } from '../../../shared/components/MuiPrimitives'
import { formatMinorMoney, moneyInputStep } from '../../../shared/lib/money'
import { useAdminPlansStore, type PlanForm } from '../../../stores/admin/useAdminPlansStore'

export function AdminPlansPage() {
  const plans = useAdminPlansStore((state) => state.plans)
  const editing = useAdminPlansStore((state) => state.editing)
  const form = useAdminPlansStore((state) => state.form)
  const open = useAdminPlansStore((state) => state.open)
  const error = useAdminPlansStore((state) => state.error)
  const saving = useAdminPlansStore((state) => state.saving)
  const load = useAdminPlansStore((state) => state.load)
  const create = useAdminPlansStore((state) => state.create)
  const edit = useAdminPlansStore((state) => state.edit)
  const close = useAdminPlansStore((state) => state.close)
  const setField = useAdminPlansStore((state) => state.setField)
  const save = useAdminPlansStore((state) => state.save)
  const toggle = useAdminPlansStore((state) => state.toggle)

  useEffect(() => { void load() }, [load])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void save()
  }

  return (
    <main className="page-container">
      <ModuleHeader title="Planes" />
      <Stack spacing={1} sx={{ alignItems: 'center', mb: 4, textAlign: 'center' }}>
        <Typography component="h2" sx={{ fontSize: { xs: 25, sm: 32 }, fontWeight: 800, maxWidth: 760 }}>
          Planes flexibles para cada centro deportivo
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
          Define la capacidad, moneda y precio mensual que verá cada negocio.
        </Typography>
        <AppButton className="primary-button" type="button" onClick={create}>Nuevo plan</AppButton>
      </Stack>

      {!open && <Box sx={{ mb: 2 }}><FeedbackAlert message={error} /></Box>}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
        {plans.map((plan, index) => {
          const currency = plan.moneda_codigo ?? plan.moneda
          const popular = plans.length > 1 && index === 1
          return (
            <Card key={plan.id} sx={{ border: 1, borderColor: popular ? 'primary.main' : 'divider', boxShadow: popular ? '0 12px 30px rgba(24,95,85,.12)' : '0 4px 18px rgba(16,32,28,.05)', display: 'flex', flexDirection: 'column', minHeight: 470 }}>
              <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', p: 3.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>{plan.nombre}</Typography>
                  {popular && <Chip color="warning" label="Popular" size="small" sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }} />}
                </Stack>
                <Box sx={{ alignItems: 'center', bgcolor: index === 1 ? 'warning.light' : 'action.hover', borderRadius: 1, color: index === 1 ? 'warning.dark' : 'primary.main', display: 'flex', height: 72, justifyContent: 'center', mt: 3, width: 72 }}>
                  <WorkspacePremiumOutlined sx={{ fontSize: 44 }} />
                </Box>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mt: 3 }}>
                  <Typography component="p" sx={{ fontSize: { xs: 34, sm: 42 }, fontWeight: 800, lineHeight: 1.1 }}>{formatMinorMoney(plan.precio_mensual_minor, currency)}</Typography>
                  <Typography color="text.secondary">/mes</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ fontSize: 14, minHeight: 42, mt: 1 }}>{plan.descripcion || 'Capacidad y soporte para operar reservas deportivas.'}</Typography>
                <Stack spacing={1.7} sx={{ mt: 3 }}>
                  <Feature text={`Hasta ${plan.limite_canchas} canchas`} />
                  <Feature text={`Facturación en ${currency}`} />
                  <Feature text="Gestión de sedes y horarios" />
                  <Feature text="Soporte administrativo" />
                  <Feature text={plan.eventos_habilitados ? `${plan.limite_eventos ?? 'Sin limite de'} eventos activos` : 'Eventos no incluidos'} />
                </Stack>
              </CardContent>
              <CardActions sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', p: 3.5, pt: 0 }}>
                <AppButton className="primary-button" type="button" onClick={() => edit(plan)}>Editar</AppButton>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}><Switch checked={plan.activo} onChange={() => void toggle(plan)} size="small" slotProps={{ input: { 'aria-label': plan.activo ? 'Desactivar plan' : 'Activar plan' } }} /><Typography color="text.secondary" sx={{ fontSize: 12 }}>{plan.activo ? 'Activo' : 'Inactivo'}</Typography></Stack>
              </CardActions>
            </Card>
          )
        })}
      </Box>

      {open && (
        <ResponsiveModalForm title={editing ? 'Editar plan' : 'Nuevo plan'} kicker="Suscripción" size="sm" onClose={close} onSubmit={submit} actions={<><AppButton className="secondary-button" type="button" onClick={close}>Cerrar</AppButton><AppButton className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar plan'}</AppButton></>}>
          <Stack spacing={2.25}>
            <PlanInput field="name" label="Nombre" form={form} setField={setField} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <PlanInput field="limit" label="Límite de canchas" form={form} setField={setField} type="number" />
              <PlanInput field="currency" label="Moneda" form={form} setField={setField} />
            </Box>
            <FieldLabel label={`Precio mensual (${form.currency})`}><AppInput className="field" required min="0" step={moneyInputStep(form.currency)} type="number" value={form.price} onChange={(event) => setField('price', event.target.value)} /></FieldLabel>
            <FieldLabel label="Descripción"><AppTextArea className="field" rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} /></FieldLabel>
            <Box sx={{ borderBlock: 1, borderColor: 'divider', py: 1 }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography sx={{ fontSize: 14, fontWeight: 800 }}>Módulo de eventos</Typography><Typography color="text.secondary" variant="caption">Running, ciclismo, natación y otros deportes.</Typography></Box><Switch checked={form.eventsEnabled} onChange={(event) => setField('eventsEnabled', event.target.checked)} /></Stack></Box>
            {form.eventsEnabled && <PlanEventInput field="eventLimit" label="Eventos activos" form={form} setField={setField} />}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><AppInput checked={form.active} type="checkbox" onChange={(event) => setField('active', event.target.checked)} /><Typography sx={{ fontSize: 14, fontWeight: 700 }}>Plan activo</Typography></Stack>
            <FeedbackAlert message={error} />
          </Stack>
        </ResponsiveModalForm>
      )}
    </main>
  )
}

function Feature({ text }: { text: string }) {
  return <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Check color="primary" sx={{ fontSize: 18 }} /><Typography sx={{ fontSize: 14 }}>{text}</Typography></Stack>
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <Stack spacing={0.75}><Typography component="label" sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography>{children}</Stack>
}

function PlanInput({ field, label, form, setField, type = 'text' }: { field: 'name' | 'limit' | 'currency'; label: string; form: PlanForm; setField: <K extends keyof PlanForm>(field: K, value: PlanForm[K]) => void; type?: string }) {
  return <FieldLabel label={label}><AppInput className="field" required type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} /></FieldLabel>
}

function PlanEventInput({ field, label, form, setField }: { field: 'eventLimit'; label: string; form: PlanForm; setField: <K extends keyof PlanForm>(field: K, value: PlanForm[K]) => void }) {
  return <FieldLabel label={label}><AppInput className="field" min="1" placeholder="Sin límite" type="number" value={form[field]} onChange={(event) => setField(field, event.target.value)} /></FieldLabel>
}
