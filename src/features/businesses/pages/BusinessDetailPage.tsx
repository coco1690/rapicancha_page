import { AccessTimeOutlined, Close, LocationOnOutlined, SportsSoccerOutlined } from '@mui/icons-material'
import { AppInput } from '../../../shared/components/MuiPrimitives'
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Chip, CircularProgress, Container, Dialog, DialogContent, DialogTitle, IconButton, Skeleton, Stack, Typography } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useBusinessStore } from '../../../stores/useBusinessStore'
import { addDaysToDateKey, dateFromKey, dateKeyInTimeZone } from '../../../shared/lib/date'
import { formatMinorMoney } from '../../../shared/lib/money'
import type { PublicCourt } from '../../../services/supabase/tables'
import { SportIcon } from '../../../shared/components/SportIcon'
import { findPendingCheckoutForSlot } from '../../../services/payments/pendingCheckout'

export function BusinessDetailPage() {
  const params = useParams()
  const business = useBusinessStore((state) => state.publicBusiness)
  const courts = useBusinessStore((state) => state.publicCourts)
  const loading = useBusinessStore((state) => state.publicLoading)
  const availabilityLoading = useBusinessStore((state) => state.publicAvailabilityLoading)
  const availabilityError = useBusinessStore((state) => state.publicAvailabilityError)
  const error = useBusinessStore((state) => state.error)
  const selectedDate = useBusinessStore((state) => state.publicSelectedDate)
  const selectedCourtId = useBusinessStore((state) => state.publicSelectedCourtId)
  const selectedSlotTime = useBusinessStore((state) => state.publicSelectedSlotTime)
  const selectedDateLabel = useBusinessStore((state) => state.publicSelectedDateLabel)
  useBusinessStore((state) => state.publicPendingRevision)
  const load = useBusinessStore((state) => state.loadPublicBusiness)
  const syncPendingCheckouts = useBusinessStore((state) => state.syncPublicPendingCheckouts)
  const setSelectedDate = useBusinessStore((state) => state.setPublicSelectedDate)
  const setSelectedSlotTime = useBusinessStore((state) => state.setPublicSelectedSlotTime)
  const openSchedule = useBusinessStore((state) => state.openPublicSchedule)
  const closeSchedule = useBusinessStore((state) => state.closePublicSchedule)
  const slotsForCourt = useBusinessStore((state) => state.publicSlotsForCourt)

  useEffect(() => {
    if (!params.slug) return
    void load(params.slug).then(syncPendingCheckouts)
  }, [load, params.slug, syncPendingCheckouts])

  useEffect(() => {
    const refreshRestoredPage = () => { void syncPendingCheckouts() }
    const refreshVisiblePage = () => { if (document.visibilityState === 'visible') void syncPendingCheckouts() }
    window.addEventListener('pageshow', refreshRestoredPage)
    document.addEventListener('visibilitychange', refreshVisiblePage)
    return () => {
      window.removeEventListener('pageshow', refreshRestoredPage)
      document.removeEventListener('visibilitychange', refreshVisiblePage)
    }
  }, [syncPendingCheckouts])

  if (loading) return <PublicLoading />
  if (error) return <Container maxWidth="sm" sx={{ py: 8 }}><Typography color="error" sx={{ fontWeight: 800 }}>{error}</Typography></Container>
  if (!business) return <Container maxWidth="sm" sx={{ py: 8 }}><Typography sx={{ fontWeight: 950 }} variant="h1">Club no disponible</Typography><Typography color="text.secondary" sx={{ mt: 1.5 }}>El enlace puede estar inactivo o el club aun no esta publicado.</Typography><Button component={Link} sx={{ mt: 3 }} to="/" variant="contained">Volver</Button></Container>

  const location = [business.ciudad, business.departamento].filter(Boolean).join(', ') || business.pais_codigo || 'Ubicacion por confirmar'
  const schedule = `${business.horario_apertura?.slice(0, 5) ?? '--'} - ${business.horario_cierre?.slice(0, 5) ?? '--'}`
  const selectedCourt = courts.find((court) => court.id === selectedCourtId) ?? null
  const minimumDate = dateKeyInTimeZone(business.timezone ?? 'America/Bogota')

  return <Box component="main" sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 69px)' }}>
    <Box sx={{ bgcolor: 'primary.main', color: 'common.white' }}>
      <Container maxWidth="md" sx={{ py: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Avatar src={business.logo_url ?? undefined} sx={{ bgcolor: 'secondary.main', color: 'primary.dark', fontSize: 17, fontWeight: 950, height: 50, width: 50 }}>{business.nombre?.slice(0, 2).toUpperCase()}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ fontSize: { xs: 24, sm: 32 }, fontWeight: 950, lineHeight: 1.05 }}>{business.nombre}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.72)', fontSize: 13, mt: 0.4 }}>Reserva sin crear cuenta</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
            <InfoChip icon={<LocationOnOutlined />} label={location} />
            <InfoChip icon={<AccessTimeOutlined />} label={schedule} />
            <InfoChip icon={<SportsSoccerOutlined />} label={`${courts.length} canchas`} />
          </Stack>
        </Stack>
      </Container>
    </Box>

    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography color="primary" sx={{ fontSize: 11, fontWeight: 950, textTransform: 'uppercase' }}>Canchas</Typography>
        <Typography component="h2" sx={{ fontSize: { xs: 23, sm: 30 }, fontWeight: 950, lineHeight: 1.1 }}>Escoge una cancha</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">Luego seleccionas el dia y la hora disponible.</Typography>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper' }}>
        {courts.map((court, index) => <CourtRow businessCurrency={business.moneda ?? 'COP'} court={court} index={index} key={court.id} onChoose={() => { if (court.id) void openSchedule(court.id) }} />)}
      </Box>

      {courts.length === 0 && <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', p: 3, textAlign: 'center' }}><Typography sx={{ fontWeight: 950 }}>No hay canchas publicas por ahora.</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Cuando el club active sus canchas, apareceran aqui.</Typography></Box>}
    </Container>

    <ScheduleModal availabilityError={availabilityError} availabilityLoading={availabilityLoading} court={selectedCourt} date={selectedDate} dateLabel={selectedDateLabel()} minimumDate={minimumDate} onClose={closeSchedule} onDateChange={setSelectedDate} onSlotSelect={setSelectedSlotTime} open={Boolean(selectedCourt)} returnTo={`/negocios/${business.slug}`} selectedSlotTime={selectedSlotTime} slots={selectedCourt ? slotsForCourt(selectedCourt) : []} />
  </Box>
}

function CourtRow({ businessCurrency, court, index, onChoose }: { businessCurrency: string; court: PublicCourt; index: number; onChoose: () => void }) {
  return <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: index === 0 ? 0 : 1, borderColor: 'divider' }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ display: 'grid', height: 42, placeItems: 'center', width: 42, borderRadius: 1, bgcolor: 'secondary.light', color: 'primary.dark', flexShrink: 0 }}><SportIcon sport={court.deporte_nombre} /></Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 950 }}>{court.nombre}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>{court.deporte_nombre ?? 'Deporte'} · {court.superficie ?? 'Superficie por definir'}</Typography>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1, rowGap: 0.75 }}>
          {court.techada && <Chip label="Techada" size="small" />}
          {court.iluminacion && <Chip label="Luz" size="small" />}
          {court.capacidad_jugadores && <Chip label={`${court.capacidad_jugadores} jug.`} size="small" />}
        </Stack>
      </Box>
      <Stack spacing={1} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Box sx={{ textAlign: 'right' }}><Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 800 }}>Desde</Typography><Typography sx={{ fontSize: 15, fontWeight: 950 }}>{formatMinorMoney(court.precio_por_hora_minor ?? 0, court.moneda ?? businessCurrency)}</Typography></Box>
        <Button onClick={onChoose} size="small" type="button" variant="contained" sx={{ minWidth: { xs: 112, sm: 136 } }}>Escoger horario</Button>
      </Stack>
    </Stack>
  </Box>
}

function ScheduleModal({ availabilityError, availabilityLoading, court, date, dateLabel, minimumDate, onClose, onDateChange, onSlotSelect, open, returnTo, selectedSlotTime, slots }: { availabilityError: string; availabilityLoading: boolean; court: PublicCourt | null; date: string; dateLabel: string; minimumDate: string; onClose: () => void; onDateChange: (date: string) => Promise<void>; onSlotSelect: (time: string) => void; open: boolean; returnTo: string; selectedSlotTime: string; slots: Array<{ time: string; label: string; priceMinor: number; currency: string; available?: boolean }> }) {
  const dayOptions = Array.from({ length: 5 }, (_, index) => {
    const value = addDaysToDateKey(minimumDate, index)
    const nextDate = dateFromKey(value)
    return { value, label: index === 0 ? 'Hoy' : new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric' }).format(nextDate).replace('.', '') }
  })
  const groupedSlots = [
    { title: 'Mañana', helper: 'Antes de las 12:00 p. m.', slots: slots.filter((slot) => Number(slot.time.slice(0, 2)) < 12) },
    { title: 'Tarde', helper: '12:00 p. m. a 5:59 p. m.', slots: slots.filter((slot) => { const hour = Number(slot.time.slice(0, 2)); return hour >= 12 && hour < 18 }) },
    { title: 'Noche', helper: 'Desde las 6:00 p. m.', slots: slots.filter((slot) => Number(slot.time.slice(0, 2)) >= 18) },
  ].filter((group) => group.slots.length > 0)

  const selectedSlot = slots.find((slot) => slot.time === selectedSlotTime && (slot.available !== false || Boolean(court?.id && findPendingCheckoutForSlot(court.id, date, slot.time))))
  const selectedPending = court?.id && selectedSlot ? findPendingCheckoutForSlot(court.id, date, selectedSlot.time) : null
  const checkoutUrl = court && selectedSlot ? selectedPending ? `/checkout/${selectedPending.reference}` : `/checkout/cancha-${court.id}?fecha=${date}&hora=${selectedSlot.time}&returnTo=${encodeURIComponent(returnTo)}&courtName=${encodeURIComponent(court.nombre ?? 'Cancha')}&priceMinor=${selectedSlot.priceMinor}&currency=${selectedSlot.currency}` : '#'

  return <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open} slotProps={{ paper: { sx: { m: { xs: 1.5, sm: 3 }, borderRadius: 1 } } }}>
    <DialogTitle sx={{ pb: 1, pr: 6 }}><Typography sx={{ fontSize: 20, fontWeight: 950 }}>{court?.nombre}</Typography><Typography color="text.secondary" variant="body2">{court?.deporte_nombre ?? 'Cancha'} · Escoge día y hora</Typography><IconButton aria-label="Cerrar" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton></DialogTitle>
    <DialogContent sx={{ pt: 0.5 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', pb: 0.25 }}>
          {dayOptions.map((day) => <Button key={day.value} onClick={() => void onDateChange(day.value)} size="small" type="button" variant={date === day.value ? 'contained' : 'outlined'} sx={{ flexShrink: 0, fontSize: 12, minHeight: 32, minWidth: 62, px: 1 }}>{day.label}</Button>)}
          <Box sx={{ flex: '0 0 128px', '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& input': { px: 1, py: 0.5 } }}><AppInput aria-label="Fecha" min={minimumDate} type="date" value={date} onChange={(event) => { if (event.target.value >= minimumDate) void onDateChange(event.target.value) }} /></Box>
        </Stack>
        {availabilityLoading && <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', py: 3 }}><CircularProgress size={20} /><Typography color="text.secondary" sx={{ fontSize: 14 }}>Consultando horarios disponibles...</Typography></Stack>}
        {availabilityError && <Typography color="error" sx={{ border: 1, borderColor: 'error.light', borderRadius: 1, fontSize: 13, p: 1.25 }}>{availabilityError}</Typography>}
        {!availabilityLoading && <Stack spacing={0.75}>
          {groupedSlots.map((group, index) => <Accordion defaultExpanded={index === 0} disableGutters elevation={0} key={group.title} sx={{ border: 1, borderColor: 'divider', borderRadius: '8px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 38, px: 1.25, '& .MuiAccordionSummary-content': { my: 0.45 } }}>
              <Box><Typography sx={{ fontSize: 13, fontWeight: 950 }}>{group.title}</Typography><Typography color="text.secondary" sx={{ fontSize: 11 }}>{group.helper}</Typography></Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.25, pb: 1.25, pt: 0 }}>
              <Box sx={{ display: 'grid', gap: 0.5, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {group.slots.map((slot) => {
                  const pending = court?.id ? findPendingCheckoutForSlot(court.id, date, slot.time) : null
                  const disabled = slot.available === false && !pending
                  return <Button aria-label={pending ? `${slot.label} continuar pago` : disabled ? `${slot.label} reservado` : slot.label} disabled={disabled} key={`${court?.id}-${slot.time}`} onClick={() => onSlotSelect(slot.time)} size="small" type="button" variant={selectedSlotTime === slot.time ? 'contained' : 'outlined'} sx={{ bgcolor: disabled ? 'action.disabledBackground' : undefined, borderColor: 'divider', color: disabled ? 'text.disabled' : selectedSlotTime === slot.time ? 'primary.contrastText' : 'text.primary', flexDirection: 'column', fontSize: 11.5, gap: 0, height: 38, justifyContent: 'center', lineHeight: 1, minHeight: 38, opacity: disabled ? 1 : undefined, px: 0.5, '&.Mui-disabled': { bgcolor: 'grey.200', borderColor: 'divider', color: 'grey.600' } }}><Box component="span">{slot.label}</Box><Box component="span" sx={{ color: pending ? 'warning.main' : disabled ? 'error.main' : 'transparent', fontSize: 9, fontWeight: 900, lineHeight: 1, mt: 0.15 }}>{pending ? 'Continuar' : 'Reservado'}</Box></Button>
                })}
              </Box>
            </AccordionDetails>
          </Accordion>)}
        </Stack>}
        {!availabilityLoading && slots.length === 0 && <Typography color="text.secondary" sx={{ fontSize: 14, py: 2, textAlign: 'center' }}>{date === minimumDate ? 'No quedan horarios disponibles para hoy.' : 'No hay horarios disponibles para este dia.'}</Typography>}
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
          {selectedSlot && <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>Horario seleccionado: <strong>{selectedSlot.label}</strong> del <strong>{dateLabel}</strong></Typography>}
          <Button component={Link} disabled={availabilityLoading || !selectedSlot || !court} fullWidth onClick={onClose} size="large" to={checkoutUrl} variant="contained">{selectedPending ? 'Continuar pago' : 'Confirmar reserva'}</Button>
        </Box>
      </Stack>
    </DialogContent>
  </Dialog>
}

function InfoChip({ icon, label }: { icon: React.ReactElement; label: string }) { return <Chip icon={icon} label={label} size="small" sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'common.white', maxWidth: '100%', '& .MuiChip-icon': { color: 'secondary.main' }, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} /> }
function PublicLoading() { return <Container maxWidth="md" sx={{ py: 3 }}><Stack spacing={1.5}><Skeleton height={118} variant="rounded" /><Skeleton height={74} variant="rounded" /><Skeleton height={220} variant="rounded" /></Stack></Container> }
