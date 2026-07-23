import { AppButton, AppInput, AppSelect, AppTextArea } from '../../../shared/components/MuiPrimitives'
import { useEffect, useMemo, type FormEvent } from 'react'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useBusinessStore, type BusinessProfileForm } from '../../../stores/useBusinessStore'

export function BusinessProfilePage() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const business = useBusinessStore((state) => state.business)
  const countries = useBusinessStore((state) => state.countries)
  const allDepartments = useBusinessStore((state) => state.departments)
  const allCities = useBusinessStore((state) => state.cities)
  const form = useBusinessStore((state) => state.profileForm)
  const catalogsLoading = useBusinessStore((state) => state.catalogsLoading)
  const saving = useBusinessStore((state) => state.saving)
  const error = useBusinessStore((state) => state.error)
  const message = useBusinessStore((state) => state.message)
  const loadCatalogs = useBusinessStore((state) => state.loadCatalogs)
  const hydrate = useBusinessStore((state) => state.hydrateProfileForm)
  const setField = useBusinessStore((state) => state.setProfileField)
  const selectCountry = useBusinessStore((state) => state.selectCountry)
  const selectDepartment = useBusinessStore((state) => state.selectDepartment)
  const saveProfile = useBusinessStore((state) => state.saveProfile)

  useEffect(() => { if (countries.length === 0) void loadCatalogs() }, [countries.length, loadCatalogs])
  useEffect(() => { hydrate(user, profile) }, [business, countries, allCities, hydrate, profile, user])

  const departments = useMemo(() => allDepartments.filter((item) => !form.countryId || item.pais_id === form.countryId), [allDepartments, form.countryId])
  const cities = useMemo(() => allCities.filter((item) => !form.departmentId || item.departamento_id === form.departmentId), [allCities, form.departmentId])
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (user) void saveProfile(user, refreshProfile) }
  const publicUrl = business?.slug ? `${window.location.origin}/negocios/${business.slug}` : ''
  const publicQrUrl = publicUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}` : ''

  return <main className="page-container"><p className="section-kicker">Configuracion</p><h1 className="page-title">{business ? 'Perfil del negocio' : 'Activar negocio'}</h1><p className="mt-2 text-zinc-600">Los horarios y precios se interpretan usando esta moneda y zona horaria.</p>{!business && <Box sx={{ mt: 4, border: 1, borderColor: 'warning.light', borderRadius: 1, bgcolor: 'rgba(255, 193, 7, 0.08)', p: 3 }}><Typography sx={{ fontWeight: 900 }}>Falta activar un plan</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>La cuenta ya existe, pero el negocio no debe crearse desde este formulario. El alta debe venir desde checkout de suscripcion o desde una prueba gratis asignada por administracion.</Typography></Box>}{business && <Box sx={{ mt: 4, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', p: 2.5 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><Avatar src={business.logo_url ?? undefined} sx={{ bgcolor: 'secondary.light', color: 'primary.dark', height: 48, width: 48 }}>{business.nombre.slice(0, 2).toUpperCase()}</Avatar><Box><Typography sx={{ fontSize: 14, fontWeight: 900 }}>Pagina publica para reservas</Typography><Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }} variant="body2">{publicUrl}</Typography></Box></Stack><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>{publicQrUrl && <Box component="img" src={publicQrUrl} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: 76, width: 76 }} />}<AppButton className="secondary-button" type="button" onClick={() => void navigator.clipboard.writeText(publicUrl)}>Copiar link</AppButton></Stack></Stack></Box>}<form className="mt-8 space-y-10" onSubmit={submit}>
    <FormSection title="Responsable" description="Datos privados de la cuenta administradora."><Field label="Nombre completo"><AppInput className="field" required value={form.ownerName} onChange={(event) => setField('ownerName', event.target.value)} /></Field><Field label="Telefono"><AppInput className="field" type="tel" value={form.ownerPhone} onChange={(event) => setField('ownerPhone', event.target.value)} /></Field></FormSection>
    <FormSection title="Datos del negocio" description="Informacion operativa del centro deportivo."><TextField field="name" label="Nombre" form={form} setField={setField} required /><TextField field="email" label="Correo" form={form} setField={setField} type="email" /><TextField field="phone" label="Telefono" form={form} setField={setField} type="tel" /><TextField field="logoUrl" label="URL del logo" form={form} setField={setField} type="url" /><TextField field="address" label="Direccion" form={form} setField={setField} required /><Field label="Descripcion" wide><AppTextArea className="field min-h-24 resize-y" value={form.description} onChange={(event) => setField('description', event.target.value)} /></Field></FormSection>
    <FormSection title="Ubicacion y operacion" description="Configura el contexto regional del negocio."><Field label="Pais"><AppSelect className="field" required disabled={catalogsLoading} value={form.countryId} onChange={(event) => selectCountry(event.target.value)}><option value="">Seleccionar</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</AppSelect></Field>{departments.length > 0 ? <Field label="Departamento / estado"><AppSelect className="field" required value={form.departmentId} onChange={(event) => selectDepartment(event.target.value)}><option value="">Seleccionar</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</AppSelect></Field> : <TextField field="departmentText" label="Departamento / estado" form={form} setField={setField} required />}{cities.length > 0 ? <Field label="Ciudad"><AppSelect className="field" required value={form.cityId} onChange={(event) => setField('cityId', event.target.value)}><option value="">Seleccionar</option>{cities.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</AppSelect></Field> : <TextField field="cityText" label="Ciudad" form={form} setField={setField} required />}<Field label="Moneda"><AppInput className="field bg-zinc-100" readOnly value={form.currency} /></Field><TextField field="timezone" label="Zona horaria" form={form} setField={setField} required /><TextField field="openingTime" label="Apertura" form={form} setField={setField} type="time" required /><TextField field="closingTime" label="Cierre" form={form} setField={setField} type="time" required /></FormSection>
    {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<div className="flex justify-end border-t border-zinc-200 pt-5"><AppButton className="primary-button flex w-full md:w-auto" disabled={saving || !business}>{saving ? 'Guardando...' : 'Guardar cambios'}</AppButton></div>
  </form></main>
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="grid min-w-0 gap-5 border-t border-zinc-200 pt-6 lg:grid-cols-[220px_minmax(0,1fr)]"><div><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p></div><div className="grid min-w-0 gap-5 md:grid-cols-2">{children}</div></section> }
function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`block min-w-0 text-sm font-semibold text-zinc-700 ${wide ? 'md:col-span-2' : ''}`}>{label}<span className="mt-1.5 block min-w-0">{children}</span></label> }
function TextField({ field, label, form, setField, type = 'text', required = false }: { field: keyof BusinessProfileForm; label: string; form: BusinessProfileForm; setField: (field: keyof BusinessProfileForm, value: string) => void; type?: string; required?: boolean }) { return <Field label={label}><AppInput className="field" required={required} type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} /></Field> }
