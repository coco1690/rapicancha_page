import { useEffect } from 'react'
import { PaymentsOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from '@mui/material'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useBookingPaymentResultStore } from '../../../stores/useBookingPaymentResultStore'

export function EpaycoResponsePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const loading = useBookingPaymentResultStore((state) => state.loading)
  const error = useBookingPaymentResultStore((state) => state.error)
  const resolveProviderReference = useBookingPaymentResultStore((state) => state.resolveProviderReference)
  const providerReference = searchParams.get('ref_payco') ?? searchParams.get('x_ref_payco') ?? ''

  useEffect(() => {
    if (!providerReference) return
    const resolve = () => {
      void resolveProviderReference(providerReference).then((reference) => {
        if (reference) navigate(`/checkout/${encodeURIComponent(reference)}/respuesta`, { replace: true })
      })
    }
    resolve()
    const intervalId = window.setInterval(resolve, 2500)
    return () => window.clearInterval(intervalId)
  }, [navigate, providerReference, resolveProviderReference])

  return <Box component="main" sx={{ bgcolor: 'background.default', display: 'grid', minHeight: 'calc(100vh - 68px)', placeItems: 'center', py: 3 }}>
    <Container maxWidth="xs">
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack spacing={2.25} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', color: 'common.white', display: 'grid', height: 72, placeItems: 'center', width: 72 }}>
              {loading ? <CircularProgress color="inherit" size={38} /> : <PaymentsOutlined sx={{ fontSize: 38 }} />}
            </Box>
            <Box>
              <Typography color="primary" sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>Respuesta ePayco</Typography>
              <Typography component="h1" sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 950, lineHeight: 1.1, mt: 0.75 }}>Estamos localizando tu reserva</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.55, mt: 1 }}>No cierres esta ventana. La confirmacion segura puede tardar unos segundos en llegar.</Typography>
            </Box>
            {!providerReference && <Alert severity="error" sx={{ textAlign: 'left', width: '100%' }}>ePayco no envio la referencia de la transaccion.</Alert>}
            {providerReference && error && <Alert severity="info" sx={{ textAlign: 'left', width: '100%' }}>Seguimos esperando la confirmacion del pago.</Alert>}
            <Button component={Link} fullWidth size="large" to="/" variant="outlined">Volver al inicio</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  </Box>
}
