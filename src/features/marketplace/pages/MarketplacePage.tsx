import { useEffect } from 'react'
import {
  ArrowUpward,
  BoltOutlined,
  Close,
  EastRounded,
  Search,
  WhatsApp,
} from '@mui/icons-material'
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'
import type { MarketplaceBusinessResult } from '../../../services/repositories/bookingRepository'
import { SportIcon } from '../../../shared/components/SportIcon'
import { useBookingStore } from '../../../stores/useBookingStore'
import { useMarketplaceUiStore } from '../../../stores/useMarketplaceUiStore'

const sports = ['Todos', 'Padel', 'Tenis', 'Voley', 'Futbol 5', 'Futbol 8', 'Futbol 11'] as const

export function MarketplacePage() {
  const filters = useBookingStore((state) => state.filters)
  const cityOptions = useBookingStore((state) => state.cityOptions)
  const filteredBusinesses = useBookingStore((state) => state.filteredBusinesses)
  const resultsOpen = useBookingStore((state) => state.resultsOpen)
  const loading = useBookingStore((state) => state.loading)
  const error = useBookingStore((state) => state.error)
  const loadMarketplace = useBookingStore((state) => state.loadMarketplace)
  const setFilter = useBookingStore((state) => state.setFilter)
  const searchMarketplace = useBookingStore((state) => state.search)
  const closeResults = useBookingStore((state) => state.closeResults)
  const resetFilters = useBookingStore((state) => state.resetFilters)
  const selectedCity = cityOptions.find((city) => city.nombre === filters.city) ?? null

  useEffect(() => { void loadMarketplace() }, [loadMarketplace])

  return <Box component="main" id="top" sx={{ bgcolor: 'background.default', overflow: 'hidden' }}>
    <Hero />

    <Box
      sx={{
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#172421' : '#e8f0ed',
        display: 'flow-root',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <Container id="buscar" maxWidth="lg" sx={{ mt: { xs: -14.25, sm: -14.25, md: -6 }, position: 'relative', zIndex: 1 }}>
        <Card className="landing-search-panel rapi-hero-search" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ px: { xs: 2, sm: 2.5, md: 3 }, py: { xs: 2.5, sm: 3, md: 3.5 } }}>
            <Grid component="form" container spacing={{ xs: 1, md: 1.5 }} sx={{ alignItems: 'end' }} onSubmit={(event) => { event.preventDefault(); searchMarketplace() }}>
              <Grid size={{ xs: 12, md: 3.25 }}>
                <Autocomplete freeSolo getOptionLabel={(option) => typeof option === 'string' ? option : `${option.nombre}, ${option.departamentos?.nombre ?? ''}`} loading={loading} onChange={(_, option) => setFilter('city', typeof option === 'string' ? option : option?.nombre ?? '')} onInputChange={(_, value) => setFilter('city', value)} options={cityOptions} size="small" value={selectedCity} renderInput={(params) => <TextField {...params} label="Ciudad" placeholder="Ej. Medellín" />} />
              </Grid>
              <Grid size={{ xs: 12, md: 2.75 }}>
                <TextField fullWidth label="Deporte" select size="small" value={filters.sport} onChange={(event) => setFilter('sport', event.target.value)}>{sports.map((sport) => <MenuItem key={sport} value={sport}>{sport}</MenuItem>)}</TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 2.75 }}>
                <TextField fullWidth label="Fecha" size="small" type="date" value={filters.date} onChange={(event) => setFilter('date', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 3.25 }}>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth size="large" startIcon={<Search />} type="submit" variant="contained">Buscar</Button>
                  <Button onClick={resetFilters} size="large" type="button" variant="outlined">Limpiar</Button>
                </Stack>
              </Grid>
            </Grid>
            {error && <Typography color="error" sx={{ mt: 1.25, fontSize: 12.5, fontWeight: 700 }}>{error}</Typography>}
          </CardContent>
        </Card>
      </Container>
      <Box
        aria-hidden
        sx={{
          borderBottom: 1,
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(183,245,106,.14)' : 'rgba(20,101,88,.12)',
          height: { xs: 36, md: 48 },
          position: 'relative',
          '&::after': {
            bgcolor: 'secondary.main',
            borderRadius: '4px 4px 0 0',
            bottom: 0,
            content: '""',
            height: 4,
            left: '50%',
            position: 'absolute',
            transform: 'translateX(-50%)',
            width: 72,
          },
        }}
      />
    </Box>

    <ResultsDialog businesses={filteredBusinesses} date={filters.date} filtersLabel={`${filters.city || 'Todas las ciudades'} - ${filters.sport || 'Todos'}`} loading={loading} onClose={closeResults} open={resultsOpen} />
    <Footer />
    <FloatingActions />
  </Box>
}

function Hero() {
  return <Box className="landing-hero" sx={{
    bgcolor: 'primary.dark',
    color: 'common.white',
    minHeight: { xs: 550, sm: 580, md: 610 },
    position: 'relative',
    '@media (min-width: 900px) and (max-height: 760px)': { minHeight: 530 },
  }}>
    <Box className="landing-hero-media" sx={{ backgroundImage: 'linear-gradient(90deg, rgba(2, 38, 30, .96) 0%, rgba(2, 42, 33, .86) 48%, rgba(2, 42, 33, .28) 100%), url("https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=2000&q=88")', backgroundPosition: { xs: '62% center', md: 'center' }, backgroundSize: 'cover', inset: 0, position: 'absolute' }} />
    <Container maxWidth="lg" sx={{
      position: 'relative',
      py: { xs: 4, sm: 6, md: 7 },
      '@media (min-width: 900px) and (max-height: 760px)': { py: 4.5 },
    }}>
      <Grid container spacing={{ xs: 3, md: 6 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Chip className="rapi-hero-kicker" icon={<BoltOutlined />} label="Reserva sin registro" size="small" sx={{ bgcolor: 'rgba(183,245,106,.14)', border: 1, borderColor: 'rgba(183,245,106,.36)', color: 'secondary.main', fontWeight: 900, '& .MuiChip-icon': { color: 'secondary.main' } }} />
          <Typography className="rapi-hero-title" component="h1" sx={{ fontSize: { xs: 39, sm: 55, md: 70 }, fontWeight: 950, lineHeight: 1.01, maxWidth: 760, mt: 2, '@media (min-width: 900px) and (max-height: 760px)': { fontSize: 58, mt: 1.5 } }}>Reserva canchas deportivas en minutos.</Typography>
          <Typography className="rapi-hero-copy" sx={{ color: 'rgba(255,255,255,.78)', fontSize: { xs: 15.5, sm: 17.5, md: 19 }, lineHeight: 1.65, maxWidth: 620, mt: { xs: 2, md: 3 }, '@media (min-width: 900px) and (max-height: 760px)': { fontSize: 16, mt: 2 } }}>Encuentra clubes por ciudad y deporte, elige un horario disponible y paga desde tu celular. Sin crear una cuenta.</Typography>
          <Stack className="rapi-hero-actions" direction="row" spacing={1.25} sx={{ mt: { xs: 3, md: 4 }, '@media (min-width: 900px) and (max-height: 760px)': { mt: 2.5 } }}>
            <Button aria-label="Contáctanos por WhatsApp" color="secondary" component="a" href="https://wa.me/573148632751?text=Hola%20Rapicancha%2C%20quiero%20informacion" size="large" startIcon={<WhatsApp />} target="_blank" rel="noreferrer" variant="contained">Contáctanos</Button>
            <Button color="inherit" component={Link} endIcon={<EastRounded />} size="large" sx={{ borderColor: 'rgba(255,255,255,.38)', color: 'common.white' }} to="/acceso" variant="outlined">Soy un club</Button>
          </Stack>
          <Stack className="rapi-hero-proof" direction="row" spacing={{ xs: 2, sm: 3.5 }} sx={{ mt: { xs: 3.5, md: 5 }, '@media (min-width: 900px) and (max-height: 760px)': { mt: 3 } }}>
            <HeroProof value="24/7" label="Reservas" />
            <HeroProof value="0" label="Filas" />
            <HeroProof value="100%" label="Móvil" />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <LiveSchedule />
        </Grid>
      </Grid>
    </Container>
  </Box>
}

function LiveSchedule() {
  const slots = [
    { time: '18:00 - 19:00', available: false },
    { time: '19:00 - 20:00', available: true },
    { time: '20:00 - 21:00', available: false },
  ]
  return <Box className="rapi-live-schedule" sx={{ display: { xs: 'none', md: 'block' }, ml: 'auto', maxWidth: 380, position: 'relative' }}>
    <Box sx={{ bgcolor: 'rgba(255,255,255,.96)', borderRadius: 2, color: '#10201c', p: 3 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box><Typography color="primary" sx={{ fontSize: 11, fontWeight: 950, textTransform: 'uppercase' }}>Agenda en vivo</Typography><Typography sx={{ fontSize: 25, fontWeight: 950, mt: 0.5 }}>Cancha Norte</Typography></Box>
        <Box sx={{ bgcolor: 'success.light', borderRadius: '50%', height: 10, width: 10 }} />
      </Stack>
      <Stack spacing={1} sx={{ mt: 3 }}>
        {slots.map((slot) => <Stack direction="row" key={slot.time} sx={{ alignItems: 'center', bgcolor: slot.available ? 'secondary.light' : '#f1f4f3', borderRadius: 1, justifyContent: 'space-between', px: 1.5, py: 1.25 }}>
          <Typography sx={{ fontWeight: 900 }}>{slot.time}</Typography>
          <Typography sx={{ color: slot.available ? 'primary.dark' : '#697471', fontSize: 11.5, fontWeight: 900 }}>{slot.available ? 'Disponible' : 'Reservado'}</Typography>
        </Stack>)}
      </Stack>
    </Box>
    <Box className="rapi-live-badge" sx={{ bgcolor: 'secondary.main', borderRadius: 1.5, bottom: -24, color: 'primary.dark', fontSize: 12, fontWeight: 950, px: 2, py: 1.25, position: 'absolute', right: -18 }}>Confirmación inmediata</Box>
  </Box>
}

function HeroProof({ label, value }: { label: string; value: string }) {
  return <Box><Typography sx={{ color: 'common.white', fontSize: { xs: 18, sm: 21 }, fontWeight: 950 }}>{value}</Typography><Typography sx={{ color: 'rgba(255,255,255,.58)', fontSize: 11.5, fontWeight: 800 }}>{label}</Typography></Box>
}

function ResultsDialog({ businesses, date, filtersLabel, loading, onClose, open }: { businesses: MarketplaceBusinessResult[]; date: string; filtersLabel: string; loading: boolean; onClose: () => void; open: boolean }) {
  return <Dialog fullWidth maxWidth="md" onClose={onClose} open={open} slotProps={{ paper: { sx: { borderRadius: 2, m: { xs: 1, sm: 3 }, maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 64px)' } } } }}>
    <DialogTitle sx={{ pb: 1, pr: 6 }}>
      <Typography sx={{ fontSize: { xs: 20, sm: 26 }, fontWeight: 950 }}>Clubes encontrados</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="body2">{filtersLabel}{date ? ` - ${date}` : ''}</Typography>
      <IconButton aria-label="Cerrar resultados" onClick={onClose} sx={{ position: 'absolute', right: 10, top: 10 }}><Close /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: 1 }}>
      {loading && <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Buscando clubes...</Typography>}
      {!loading && <Stack spacing={1.25}>
        <Chip color="secondary" label={`${businesses.length} clubes`} sx={{ alignSelf: 'flex-start' }} />
        {businesses.map((business) => <Card key={business.negocioId} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
                <Avatar src={business.logoUrl ?? undefined} sx={{ bgcolor: 'secondary.light', color: 'primary.dark', flexShrink: 0, fontSize: 13, fontWeight: 950, height: 48, width: 48 }}>{business.negocioNombre.slice(0, 2).toUpperCase()}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: { xs: 17, sm: 19 }, fontWeight: 950 }}>{business.negocioNombre}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12.5, mt: 0.25 }}>{[business.ciudad, business.departamento].filter(Boolean).join(', ')}</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 1, rowGap: 0.5 }}>
                    {business.sports.slice(0, 3).map((sport) => <Chip icon={<SportIcon sport={sport} />} key={sport} label={sport} size="small" />)}
                    <Chip label={`${business.courts.length} canchas`} size="small" />
                  </Stack>
                </Box>
              </Stack>
              <Button component={Link} fullWidth onClick={onClose} sx={{ width: { sm: 'auto' } }} to={`/negocios/${business.negocioSlug}`} variant="contained">Ver horarios</Button>
            </Stack>
          </CardContent>
        </Card>)}
        {businesses.length === 0 && <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}><Typography sx={{ fontWeight: 950 }}>No encontramos clubes.</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Prueba otra ciudad o cambia el deporte.</Typography></Box>}
      </Stack>}
    </DialogContent>
  </Dialog>
}

function Footer() {
  return <Box component="footer" sx={{ bgcolor: 'primary.dark', color: 'common.white', py: { xs: 4, md: 5 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}><Typography sx={{ fontSize: 23, fontWeight: 950 }}>Rapicancha</Typography><Typography sx={{ color: 'rgba(255,255,255,.68)', fontSize: 14, lineHeight: 1.6, mt: 0.75, maxWidth: 460 }}>Reservas deportivas y operación digital para clubes multi-deporte.</Typography></Grid>
        <Grid size={{ xs: 12, sm: 7, md: 4 }}><Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}><Typography component="a" href="#buscar" sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }}>Buscar</Typography><Typography component={Link} sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }} to="/acceso">Clubes</Typography><Typography component={Link} sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }} to="/registro">Crear cuenta</Typography></Stack></Grid>
        <Grid size={{ xs: 12, sm: 5, md: 3 }}><Button color="secondary" component="a" fullWidth href="https://wa.me/573148632751?text=Hola%20Rapicancha%2C%20quiero%20informacion" startIcon={<WhatsApp />} target="_blank" variant="contained">Hablar por WhatsApp</Button></Grid>
      </Grid>
      <Typography sx={{ borderTop: 1, borderColor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.5)', fontSize: 12.5, mt: 3.5, pt: 2 }}>2026 Rapicancha. Plataforma SaaS y marketplace deportivo.</Typography>
    </Container>
  </Box>
}

function FloatingActions() {
  const visible = useMarketplaceUiStore((state) => state.floatingActionsVisible)
  const setVisible = useMarketplaceUiStore((state) => state.setFloatingActionsVisible)

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 420)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [setVisible])

  return <Stack spacing={1} sx={{
    bottom: { xs: 14, sm: 22 },
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    position: 'fixed',
    right: { xs: 12, sm: 22 },
    transform: visible ? 'translateY(0)' : 'translateY(14px)',
    transition: 'opacity 180ms ease, transform 180ms ease',
    zIndex: 30,
  }}>
    <Button aria-label="Subir al inicio" component="a" href="#top" sx={{ borderRadius: '50%', height: { xs: 44, sm: 50 }, minWidth: 0, width: { xs: 44, sm: 50 } }} variant="contained"><ArrowUpward /></Button>
    <Button aria-label="WhatsApp Rapicancha" color="success" component="a" href="https://wa.me/573148632751?text=Hola%20Rapicancha%2C%20quiero%20informacion" sx={{ borderRadius: '50%', height: { xs: 44, sm: 50 }, minWidth: 0, width: { xs: 44, sm: 50 } }} target="_blank" variant="contained"><WhatsApp /></Button>
  </Stack>
}
