import { useEffect, type FormEvent } from 'react'
import { CalendarMonthOutlined, LockOutlined, PaymentsOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Checkbox, Container, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useGuestCheckoutStore } from '../../../stores/useGuestCheckoutStore'
import { formatMinorMoney } from '../../../shared/lib/money'

export function GuestCheckoutPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const form = useGuestCheckoutStore((state) => state.form)
  const context = useGuestCheckoutStore((state) => state.context)
  const submitting = useGuestCheckoutStore((state) => state.submitting)
  const error = useGuestCheckoutStore((state) => state.error)
  const message = useGuestCheckoutStore((state) => state.message)
  const reference = useGuestCheckoutStore((state) => state.reference)
  const holdSecondsLeft = useGuestCheckoutStore((state) => state.holdSecondsLeft)
  const hydrate = useGuestCheckoutStore((state) => state.hydrate)
  const hydrateReference = useGuestCheckoutStore((state) => state.hydrateReference)
  const setField = useGuestCheckoutStore((state) => state.setField)
  const tickHold = useGuestCheckoutStore((state) => state.tickHold)
  const submitCheckout = useGuestCheckoutStore((state) => state.submit)
  const cancelCheckout = useGuestCheckoutStore((state) => state.cancel)

  useEffect(() => {
    const bookingReference = params.bookingReference ?? ''
    if (bookingReference.startsWith('cancha-')) {
      hydrate({
        courtId: bookingReference.replace(/^cancha-/, ''),
        date: searchParams.get('fecha') ?? '',
        time: searchParams.get('hora') ?? '',
        returnTo: searchParams.get('returnTo') ?? '/',
        courtName: searchParams.get('courtName') ?? 'Cancha',
        priceMinor: Number(searchParams.get('priceMinor') ?? 0),
        currency: searchParams.get('currency') ?? 'COP',
      })
      return
    }
    hydrateReference(bookingReference)
  }, [hydrate, hydrateReference, params.bookingReference, searchParams])

  useEffect(() => {
    tickHold()
    const intervalId = window.setInterval(tickHold, 1000)
    return () => window.clearInterval(intervalId)
  }, [tickHold])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitCheckout()
  }
  const cancel = async () => {
    const nextPath = await cancelCheckout()
    navigate(nextPath, { replace: true })
  }

  const priceLabel = context.priceMinor > 0 ? formatMinorMoney(context.priceMinor, context.currency) : 'Por confirmar'
  const holdLabel = reference ? formatCountdown(holdSecondsLeft) : '7 min'

  return <Box component="main" sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 68px)', py: { xs: 1.5, sm: 3, md: 7 } }}>
    <Container maxWidth="md">
      <Stack spacing={{ xs: 1.5, sm: 3 }}>
        <Box>
          <Typography color="primary" sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>Checkout seguro</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 36, md: 46 }, fontWeight: 950, lineHeight: 1.05, mt: 0.75 }}>Completa tu reserva</Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: 13.5, sm: 16 }, mt: 1 }}>No necesitas crear cuenta. Tus datos se usan para confirmar la reserva y el comprobante.</Typography>
        </Box>

        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1.25, sm: 2, md: 3 } }}>
            <Box sx={{ display: 'grid', gap: { xs: 0.75, sm: 1.25 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, mb: { xs: 1.25, sm: 2.5 } }}>
              <SummaryItem icon={<CalendarMonthOutlined />} label="Fecha" value={context.date || 'Sin fecha'} />
              <SummaryItem icon={<PaymentsOutlined />} label="Horario" value={context.time ? `${context.time} - ${nextHour(context.time)}` : 'Sin hora'} />
              <SummaryItem icon={<PaymentsOutlined />} label="Precio" value={priceLabel} />
              <SummaryItem icon={<LockOutlined />} label="Tiempo" value={holdLabel} />
            </Box>

            <Box component="form" onSubmit={submit}>
              <Stack spacing={{ xs: 1.25, sm: 2 }}>
                <TextField fullWidth label="Nombre completo" required size="small" value={form.customerName} onChange={(event) => setField('customerName', event.target.value)} />
                <TextField fullWidth label="Telefono" required size="small" type="tel" value={form.customerPhone} onChange={(event) => setField('customerPhone', event.target.value)} />
                <TextField fullWidth label="Correo" size="small" type="email" value={form.customerEmail} onChange={(event) => setField('customerEmail', event.target.value)} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField fullWidth label="Tipo de documento" required select size="small" value={form.customerDocumentType} onChange={(event) => setField('customerDocumentType', event.target.value)}>
                    <MenuItem value="CC">Cedula</MenuItem>
                    <MenuItem value="CE">Cedula extranjeria</MenuItem>
                    <MenuItem value="NIT">NIT</MenuItem>
                    <MenuItem value="PPN">Pasaporte</MenuItem>
                  </TextField>
                  <TextField fullWidth label="Documento" required size="small" value={form.customerDocument} onChange={(event) => setField('customerDocument', event.target.value)} />
                </Stack>
                <FormControlLabel control={<Checkbox checked={form.acceptsMarketing} size="small" onChange={(event) => setField('acceptsMarketing', event.target.checked)} />} label={<Typography sx={{ fontSize: { xs: 13.5, sm: 16 } }}>Acepto recibir promociones del club</Typography>} />

                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="info">{message}{reference ? ` Referencia: ${reference}` : ''}</Alert>}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                  <Button disabled={submitting} fullWidth size="large" type="submit" variant="contained">{submitting ? 'Abriendo ePayco...' : reference ? 'Continuar pago' : 'Pagar con ePayco'}</Button>
                  <Button disabled={submitting} fullWidth onClick={() => void cancel()} size="large" type="button" variant="outlined">Cancelar reserva</Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  </Box>
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <Stack direction="row" spacing={{ xs: 0.75, sm: 1.25 }} sx={{ alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0, p: { xs: 1, sm: 1.5 } }}><Box sx={{ color: 'primary.main', display: 'grid', flexShrink: 0, placeItems: 'center', '& .MuiSvgIcon-root': { fontSize: { xs: 18, sm: 22 } } }}>{icon}</Box><Box sx={{ minWidth: 0 }}><Typography color="text.secondary" sx={{ fontSize: { xs: 10.5, sm: 12 }, fontWeight: 800 }}>{label}</Typography><Typography sx={{ fontSize: { xs: 12.5, sm: 15 }, fontWeight: 900, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography></Box></Stack>
}

function nextHour(time: string) {
  return `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
