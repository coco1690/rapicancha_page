import { AppAutocomplete, AppButton, AppInput, AppSelect, AppTextArea } from '../../../shared/components/MuiPrimitives'
import { useEffect, useMemo, type FormEvent } from 'react'
import { Avatar, Box, Chip, FormControlLabel, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { RowActionsMenu } from '../../../shared/components/RowActionsMenu'
import { getProviderLabel, paymentProviders } from '../../../services/payments/paymentProvider'
import { useAdminBusinessesStore, type BusinessForm } from '../../../stores/admin/useAdminBusinessesStore'
import { InternationalPhoneField } from '../../../shared/components/InternationalPhoneField'

const stateOptions: Array<{ value: BusinessForm['state']; label: string }> = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const subscriptionOptions: Array<{ value: BusinessForm['subscriptionStatus']; label: string }> = [
  { value: 'active', label: 'Activa' },
  { value: 'trialing', label: 'En prueba' },
  { value: 'inactive', label: 'Inactiva' },
  { value: 'past_due', label: 'Pago pendiente' },
  { value: 'canceled', label: 'Cancelada' },
]

export function AdminBusinessesPage() {
  const businesses = useAdminBusinessesStore((state) => state.businesses)
  const plans = useAdminBusinessesStore((state) => state.plans)
  const users = useAdminBusinessesStore((state) => state.users)
  const countries = useAdminBusinessesStore((state) => state.countries)
  const departments = useAdminBusinessesStore((state) => state.departments)
  const cities = useAdminBusinessesStore((state) => state.cities)
  const editing = useAdminBusinessesStore((state) => state.editing)
  const form = useAdminBusinessesStore((state) => state.form)
  const open = useAdminBusinessesStore((state) => state.open)
  const formStep = useAdminBusinessesStore((state) => state.formStep)
  const saving = useAdminBusinessesStore((state) => state.saving)
  const error = useAdminBusinessesStore((state) => state.error)
  const message = useAdminBusinessesStore((state) => state.message)
  const load = useAdminBusinessesStore((state) => state.load)
  const create = useAdminBusinessesStore((state) => state.create)
  const edit = useAdminBusinessesStore((state) => state.edit)
  const close = useAdminBusinessesStore((state) => state.close)
  const setField = useAdminBusinessesStore((state) => state.setField)
  const selectCountry = useAdminBusinessesStore((state) => state.selectCountry)
  const selectDepartment = useAdminBusinessesStore((state) => state.selectDepartment)
  const setFormStep = useAdminBusinessesStore((state) => state.setFormStep)
  const nextStep = useAdminBusinessesStore((state) => state.nextStep)
  const save = useAdminBusinessesStore((state) => state.save)
  const cancel = useAdminBusinessesStore((state) => state.cancel)

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  const availableDepartments = useMemo(() => departments.filter((item) => item.pais_id === form.countryId), [departments, form.countryId])
  const availableCities = useMemo(() => cities.filter((item) => item.departamento_id === form.departmentId), [cities, form.departmentId])
  const currencies = useMemo(() => Array.from(new Set(countries.map((item) => item.moneda_codigo))).sort(), [countries])
  const timezones = useMemo(() => Array.from(new Set([...countries.map((item) => item.zona_horaria_default), form.timezone].filter(Boolean))).sort(), [countries, form.timezone])
  const selectedPlan = useMemo(() => plans.find((item) => item.id === form.planId), [form.planId, plans])
  const freeActivePlan = form.state === 'activo' && selectedPlan?.precio_mensual_minor === 0
  const preventSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault() }

  return <main className="page-container">
    <ModuleHeader title="Negocios" />
    <Stack spacing={1.25} sx={{ mb: 2 }}>
      <FeedbackAlert message={!open ? error : ''} />
      <FeedbackAlert message={message} severity="success" />
    </Stack>

    <AdminTableShell title="Centros deportivos" actions={<AppButton className="primary-button" type="button" onClick={create}>Nuevo negocio</AppButton>}>
      <TableContainer>
        <Table aria-label="Negocios" sx={{ minWidth: 1220 }}>
          <TableHead><TableRow><TableCell>Negocio</TableCell><TableCell>Responsable</TableCell><TableCell>Plan</TableCell><TableCell>Pagos</TableCell><TableCell>Suscripcion</TableCell><TableCell>Fin prueba</TableCell><TableCell>Estado</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {businesses.map((item) => <TableRow hover key={item.id}>
              <TableCell>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Avatar src={item.logo_url ?? undefined} sx={{ bgcolor: 'secondary.light', color: 'primary.dark', fontSize: 13, fontWeight: 800, height: 34, width: 34 }}>{item.nombre.slice(0, 2).toUpperCase()}</Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{item.nombre}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>{item.slug}</Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell><Typography sx={{ fontSize: 14 }}>{item.usuarios?.nombre || 'Sin asignar'}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{item.usuarios?.email}</Typography></TableCell>
              <TableCell>{item.planes?.nombre || 'Sin plan'}</TableCell>
              <TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{getProviderLabel(item.payment_provider)}</Typography><Typography color="text.secondary" sx={{ fontSize: 12, maxWidth: 180 }} noWrap>{item.provider_account_id || 'Sin cuenta conectada'}</Typography></TableCell>
              <TableCell><Chip color={item.estado_suscripcion === 'active' || item.estado_suscripcion === 'trialing' ? 'success' : item.estado_suscripcion === 'past_due' ? 'warning' : 'default'} label={item.estado_suscripcion} size="small" /></TableCell>
              <TableCell><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.fecha_fin_prueba ? new Date(item.fecha_fin_prueba).toLocaleDateString('es-CO') : '-'}</Typography></TableCell>
              <TableCell><Chip color={item.estado === 'activo' ? 'success' : item.estado === 'suspendido' ? 'warning' : 'default'} label={item.estado} size="small" /></TableCell>
              <TableCell align="center"><RowActionsMenu rowId={`business-${item.id}`} actions={[{ label: 'Editar', onClick: () => edit(item) }, { label: 'Cancelar', destructive: true, disabled: item.estado === 'cancelado', onClick: () => { if (window.confirm(`Cancelar ${item.nombre}?`)) void cancel(item) } }]} /></TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </AdminTableShell>

    {open && <div className="business-form-backdrop"><form className="business-form-dialog" onSubmit={preventSubmit}>
      <header className="business-form-header flex shrink-0 items-center justify-between gap-3 bg-zinc-950 px-4 pb-3 text-white md:px-6 md:py-4">
        <div><p className="text-[11px] font-bold uppercase text-emerald-400">Paso {formStep + 1} de 4</p><h2 className="text-lg font-black">{editing ? 'Editar negocio' : 'Nuevo negocio'}</h2></div>
        <AppButton type="button" className="responsive-modal-close" onClick={close}>X</AppButton>
      </header>
      <div className="grid shrink-0 grid-cols-4 border-b border-zinc-200 px-2 md:px-6">{['Datos', 'Ubicacion', 'Operacion', 'Facturacion'].map((label, index) => <AppButton key={label} type="button" className={`border-b-2 py-3 text-xs font-bold ${formStep === index ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-zinc-400'}`} onClick={() => index < formStep && setFormStep(index)}>{index + 1}. {label}</AppButton>)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        {formStep === 0 && <FormStep title="Datos principales">
          <Input field="name" label="Nombre comercial *" form={form} setField={setField} wide />
          <Input field="slug" label="Slug / URL publica" form={form} setField={setField} />
          <AppAutocomplete label="Responsable *" required value={form.ownerId} options={users.map((item) => ({ value: item.id, label: `${item.nombre} · ${item.email}` }))} onChange={(value) => setField('ownerId', value)} />
          <AppAutocomplete label="Plan *" required value={form.planId} options={plans.map((item) => ({ value: item.id, label: `${item.nombre} · ${item.limite_canchas} canchas` }))} onChange={(value) => setField('planId', value)} />
          <Field label="Estado"><AppSelect className="field" value={form.state} onChange={(event) => setField('state', event.target.value as BusinessForm['state'])}>{stateOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</AppSelect></Field>
          <Input field="email" label="Correo" form={form} setField={setField} type="email" />
          <InternationalPhoneField countries={countries} countryCode={form.phoneCountryCode} phone={form.phone} onCountryChange={(value) => setField('phoneCountryCode', value)} onPhoneChange={(value) => setField('phone', value)} />
          <Input field="logoUrl" label="URL del logo" form={form} setField={setField} type="url" wide />
        </FormStep>}
        {formStep === 1 && <FormStep title="Ubicacion">
          <AppAutocomplete label="Pais *" required value={form.countryId} options={countries.map((item) => ({ value: item.id, label: item.nombre }))} onChange={selectCountry} />
          <AppAutocomplete label="Departamento *" required value={form.departmentId} options={availableDepartments.map((item) => ({ value: item.id, label: item.nombre }))} onChange={selectDepartment} />
          <AppAutocomplete label="Ciudad *" required value={form.cityId} options={availableCities.map((item) => ({ value: item.id, label: item.nombre }))} onChange={(value) => setField('cityId', value)} />
          <Input field="address" label="Direccion *" form={form} setField={setField} wide />
          <Input field="latitude" label="Latitud" form={form} setField={setField} type="number" />
          <Input field="longitude" label="Longitud" form={form} setField={setField} type="number" />
        </FormStep>}
        {formStep === 2 && <FormStep title="Operacion">
          <AppAutocomplete label="Moneda" value={form.currency} options={currencies.map((item) => ({ value: item, label: item }))} onChange={(value) => setField('currency', value)} />
          <AppAutocomplete label="Zona horaria" value={form.timezone} options={timezones.map((item) => ({ value: item, label: item }))} onChange={(value) => setField('timezone', value)} />
          <Input field="openingTime" label="Apertura" form={form} setField={setField} type="time" />
          <Input field="closingTime" label="Cierre" form={form} setField={setField} type="time" />
          <InternationalPhoneField countries={countries} countryCode={form.whatsappCountryCode} phone={form.whatsappPhone} label="WhatsApp de reservas" onCountryChange={(value) => setField('whatsappCountryCode', value)} onPhoneChange={(value) => setField('whatsappPhone', value)} required={form.whatsappNotificationsActive} />
          <Field label="Notificaciones WhatsApp"><FormControlLabel control={<Switch checked={form.whatsappNotificationsActive} onChange={(event) => setField('whatsappNotificationsActive', event.target.checked)} />} label={form.whatsappNotificationsActive ? 'Activas' : 'Inactivas'} /></Field>
          <Field label="Modulos activos" wide><AppTextArea className="field min-h-20" placeholder="reservas, torneos, iot" value={form.modules} onChange={(event) => setField('modules', event.target.value)} /></Field>
          <Field label="Descripcion" wide><AppTextArea className="field min-h-20" value={form.description} onChange={(event) => setField('description', event.target.value)} /></Field>
        </FormStep>}
        {formStep === 3 && <FormStep title="Facturacion y prueba">
          {freeActivePlan && <Box sx={{ gridColumn: '1 / -1', border: 1, borderColor: 'success.light', borderRadius: 1, bgcolor: 'rgba(76, 175, 80, 0.08)', p: 2 }}><Typography sx={{ fontSize: 13, fontWeight: 900 }}>Plan gratuito activo</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">La suscripcion queda automaticamente en prueba y la fecha se completa a 30 dias si esta vacia.</Typography></Box>}
          <Field label="Estado de suscripcion"><AppSelect className="field" value={form.subscriptionStatus} onChange={(event) => setField('subscriptionStatus', event.target.value as BusinessForm['subscriptionStatus'])}>{subscriptionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</AppSelect></Field>
          <Input field="trialEndsAt" label="Fecha fin de prueba" form={form} setField={setField} type="datetime-local" />
          <Field label="Proveedor de pagos"><AppSelect className="field" value={form.paymentProvider} onChange={(event) => setField('paymentProvider', event.target.value as BusinessForm['paymentProvider'])}>{paymentProviders.map((provider) => <option key={provider} value={provider}>{getProviderLabel(provider)}</option>)}</AppSelect></Field>
          <Input field="providerAccountId" label="Cuenta del proveedor" form={form} setField={setField} />
          <Input field="providerOnboardingStatus" label="Estado onboarding" form={form} setField={setField} />
        </FormStep>}
        <Box sx={{ mt: 2 }}><FeedbackAlert message={error} /></Box>
      </div>
      <footer className="business-form-footer flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-4 pt-3 md:flex-row md:justify-between md:px-6 md:py-4">
        <AppButton className="secondary-button flex w-full md:w-auto" type="button" onClick={() => formStep === 0 ? close() : setFormStep((value) => value - 1)}>{formStep === 0 ? 'Cancelar' : 'Anterior'}</AppButton>
        {formStep < 3 ? <AppButton className="primary-button flex w-full md:w-auto" type="button" onClick={nextStep}>Continuar</AppButton> : <AppButton className="primary-button flex w-full md:w-auto" disabled={saving} type="button" onClick={() => void save()}>{saving ? 'Guardando...' : 'Guardar'}</AppButton>}
      </footer>
    </form></div>}
  </main>
}

function FormStep({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="text-lg font-black">{title}</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div></section> }
function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`min-w-0 text-sm font-semibold ${wide ? 'md:col-span-2' : ''}`}>{label}<span className="mt-1.5 block">{children}</span></label> }
function Input({ field, label, form, setField, type = 'text', wide = false }: { field: 'name' | 'slug' | 'email' | 'phone' | 'whatsappPhone' | 'logoUrl' | 'address' | 'latitude' | 'longitude' | 'openingTime' | 'closingTime' | 'trialEndsAt' | 'providerAccountId' | 'providerOnboardingStatus'; label: string; form: BusinessForm; setField: <K extends keyof BusinessForm>(field: K, value: BusinessForm[K]) => void; type?: string; wide?: boolean }) { return <Field label={label} wide={wide}><AppInput className="field" required={label.includes('*')} type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} /></Field> }
