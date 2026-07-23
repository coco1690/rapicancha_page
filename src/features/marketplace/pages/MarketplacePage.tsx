import { ArrowUpward, CalendarMonthOutlined, Close, LocationOnOutlined, Search, SportsSoccerOutlined, WhatsApp } from '@mui/icons-material'
import { Autocomplete, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, IconButton, Container, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { MarketplaceBusinessResult } from '../../../services/repositories/bookingRepository'
import { SportIcon } from '../../../shared/components/SportIcon'
import { useBookingStore } from '../../../stores/useBookingStore'

const sports = ['Todos', 'Padel', 'Tenis', 'Voley', 'Futbol 5', 'Futbol 8', 'Futbol 11'] as const
const featuredSports = ['Padel', 'Tenis', 'Futbol 5', 'Voley'] as const
const landingImages = [
  { title: 'Reservas desde el celular', text: 'El cliente elige cancha, dia y hora sin crear cuenta.', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=900&q=82' },
  { title: 'Operaciones para clubes', text: 'Agenda clara para clubes con varias canchas y deportes.', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=82' },
  { title: 'Torneos y comunidad', text: 'Una base lista para crecer hacia torneos, equipos y pagos.', image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=82' },
]

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

    <Container id="buscar" maxWidth="lg" sx={{ mt: { xs: -3, md: -5 }, position: 'relative', zIndex: 2 }}>
      <Card sx={{ borderRadius: 2, boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 20px 80px rgba(0,0,0,.3)' : '0 20px 80px rgba(2,44,34,.14)' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid component="form" container spacing={2} sx={{ alignItems: 'end' }} onSubmit={(event) => { event.preventDefault(); searchMarketplace() }}>
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Autocomplete freeSolo getOptionLabel={(option) => typeof option === 'string' ? option : `${option.nombre}, ${option.departamentos?.nombre ?? ''}`} loading={loading} onChange={(_, option) => setFilter('city', typeof option === 'string' ? option : option?.nombre ?? '')} onInputChange={(_, value) => setFilter('city', value)} options={cityOptions} value={selectedCity} renderInput={(params) => <TextField {...params} label="Ciudad" placeholder="Ej. Medellin" />} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth label="Deporte" select value={filters.sport} onChange={(event) => setFilter('sport', event.target.value)}>{sports.map((sport) => <MenuItem key={sport} value={sport}>{sport}</MenuItem>)}</TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth label="Fecha" type="date" value={filters.date} onChange={(event) => setFilter('date', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Stack direction="row" spacing={1}><Button fullWidth startIcon={<Search />} type="submit" variant="contained">Buscar</Button><Button onClick={resetFilters} type="button" variant="outlined">Limpiar</Button></Stack>
            </Grid>
          </Grid>
          {error && <Typography color="error" sx={{ mt: 1.5, fontSize: 13 }}>{error}</Typography>}
        </CardContent>
      </Card>
    </Container>

    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}><ValueBlock icon={<LocationOnOutlined />} title="Canchas cercanas" text="Filtra por ciudad y deporte para encontrar sedes listas para reservar." /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><ValueBlock icon={<CalendarMonthOutlined />} title="Horarios reales" text="Los turnos ocupados se bloquean desde la disponibilidad del club." /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><ValueBlock icon={<SportsSoccerOutlined />} title="Multi-deporte" text="Padel, tenis, voley y futbol en una misma experiencia de reserva." /></Grid>
      </Grid>

      <Box sx={{ mt: { xs: 7, md: 10 } }}>
        <Typography color="primary" sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>Deportes destacados</Typography>
        <Typography component="h2" sx={{ fontSize: { xs: 30, md: 44 }, fontWeight: 950, mt: 1 }}>Reserva en pocos toques</Typography>
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {featuredSports.map((sport) => <Grid key={sport} size={{ xs: 6, md: 3 }}><Card sx={{ borderRadius: 2, height: '100%' }}><CardContent><Box sx={{ bgcolor: 'secondary.light', borderRadius: 1.5, color: 'primary.dark', display: 'grid', height: 46, placeItems: 'center', width: 46 }}><SportIcon sport={sport} /></Box><Typography sx={{ fontSize: 18, fontWeight: 950, mt: 2 }}>{sport}</Typography><Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>Canchas por hora y disponibilidad inmediata.</Typography></CardContent></Card></Grid>)}
        </Grid>
      </Box>

    </Container>

    <ResultsDialog businesses={filteredBusinesses} date={filters.date} filtersLabel={`${filters.city || 'Todas las ciudades'} · ${filters.sport || 'Todos'}`} loading={loading} onClose={closeResults} open={resultsOpen} />
    <VisualSection />
    <Footer />
    <FloatingActions />
  </Box>
}

function ResultsDialog({ businesses, date, filtersLabel, loading, onClose, open }: { businesses: MarketplaceBusinessResult[]; date: string; filtersLabel: string; loading: boolean; onClose: () => void; open: boolean }) {
  return <Dialog fullWidth maxWidth="md" onClose={onClose} open={open} slotProps={{ paper: { sx: { borderRadius: 2, m: { xs: 1.5, sm: 3 } } } }}>
    <DialogTitle sx={{ pb: 1, pr: 6 }}>
      <Typography sx={{ fontSize: { xs: 21, sm: 26 }, fontWeight: 950 }}>Clubes encontrados</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{filtersLabel}{date ? ` · ${date}` : ''}</Typography>
      <IconButton aria-label="Cerrar resultados" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
    </DialogTitle>
    <DialogContent sx={{ pt: 1 }}>
      {loading && <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Buscando clubes...</Typography>}
      {!loading && <Stack spacing={1.5}>
        <Chip color="secondary" label={`${businesses.length} clubes`} sx={{ alignSelf: 'flex-start' }} />
        {businesses.map((business) => <Card key={business.negocioId} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
                <Avatar src={business.logoUrl ?? undefined} sx={{ bgcolor: 'secondary.light', color: 'primary.dark', flexShrink: 0, fontSize: 14, fontWeight: 950, height: 52, width: 52 }}>{business.negocioNombre.slice(0, 2).toUpperCase()}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 19, fontWeight: 950 }}>{business.negocioNombre}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.35 }}>{[business.ciudad, business.departamento].filter(Boolean).join(', ')}</Typography>
                  {business.direccion && <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.35 }}>{business.direccion}</Typography>}
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1.25, rowGap: 0.75 }}>
                    {business.sports.map((sport) => <Chip icon={<SportIcon sport={sport} />} key={sport} label={sport} size="small" />)}
                    <Chip label={`${business.courts.length} canchas`} size="small" />
                  </Stack>
                </Box>
              </Stack>
              <Button component={Link} onClick={onClose} sx={{ minWidth: { sm: 132 } }} to={`/negocios/${business.negocioSlug}`} variant="contained">Ver horarios</Button>
            </Stack>
          </CardContent>
        </Card>)}
        {businesses.length === 0 && <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center' }}><Typography sx={{ fontWeight: 950 }}>No encontramos clubes para esa busqueda.</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>Prueba otra ciudad o cambia el deporte.</Typography></Box>}
      </Stack>}
    </DialogContent>
  </Dialog>
}

function Hero() {
  return <Box sx={{ bgcolor: 'primary.dark', color: 'common.white', minHeight: { xs: 'auto', lg: 650 }, position: 'relative' }}>
    <Box sx={{ backgroundImage: 'linear-gradient(90deg, rgba(2, 44, 34, .94) 0%, rgba(2, 44, 34, .86) 44%, rgba(2, 44, 34, .28) 100%), url("https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1800&q=85")', backgroundPosition: 'center', backgroundSize: 'cover', inset: 0, position: 'absolute' }} />
    <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 9 } }}>
      <Grid container spacing={5} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography sx={{ color: 'secondary.main', fontSize: 13, fontWeight: 950, letterSpacing: 0, textTransform: 'uppercase' }}>Reserva sin registrarte</Typography>
          <Typography component="h1" sx={{ fontSize: { xs: 42, sm: 58, md: 72 }, fontWeight: 950, lineHeight: 0.98, mt: 2, maxWidth: 760 }}>Encuentra una cancha y juega hoy.</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.76)', fontSize: { xs: 17, md: 19 }, lineHeight: 1.7, mt: 3, maxWidth: 620 }}>Busca canchas por ciudad, deporte y fecha. El cliente reserva desde el celular sin crear cuenta, y el club recibe una agenda ordenada.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}><Button color="secondary" component="a" href="#buscar" size="large" startIcon={<Search />} variant="contained">Buscar cancha</Button><Button component={Link} size="large" sx={{ borderColor: 'rgba(255,255,255,.34)', color: 'common.white' }} to="/acceso" variant="outlined">Soy un club</Button></Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}><Box sx={{ display: { xs: 'none', md: 'block' }, position: 'relative' }}><Card sx={{ bgcolor: 'rgba(255,255,255,.94)', borderRadius: 2, color: '#10201c', ml: 'auto', p: 1, width: 360 }}><CardContent><Typography color="primary" sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>Agenda en vivo</Typography><Typography sx={{ fontSize: 28, fontWeight: 950, mt: 1 }}>Cancha Norte</Typography><Stack spacing={1.2} sx={{ mt: 3 }}>{['18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'].map((slot, index) => <Stack direction="row" key={slot} sx={{ alignItems: 'center', bgcolor: index === 1 ? 'secondary.light' : '#f1f4f3', borderRadius: 1, color: '#10201c', justifyContent: 'space-between', px: 1.5, py: 1.2 }}><Typography sx={{ fontWeight: 900 }}>{slot}</Typography><Typography sx={{ color: index === 1 ? 'primary.dark' : '#697471', fontSize: 12, fontWeight: 900 }}>{index === 1 ? 'Disponible' : 'Reservado'}</Typography></Stack>)}</Stack></CardContent></Card></Box></Grid>
      </Grid>
    </Container>
  </Box>
}

function VisualSection() {
  return <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.100', py: { xs: 6, md: 9 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={4} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}><Typography color="primary" sx={{ fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }}>Experiencia Rapicancha</Typography><Typography component="h2" sx={{ fontSize: { xs: 30, md: 44 }, fontWeight: 950, lineHeight: 1.08, mt: 1 }}>Una reserva simple para el jugador y ordenada para el club.</Typography><Typography color="text.secondary" sx={{ fontSize: 17, lineHeight: 1.7, mt: 2.5 }}>La landing debe vender confianza desde el primer vistazo: imagenes reales de deporte, busqueda directa y accesos rapidos para clubes que quieren digitalizar su agenda.</Typography><Button component={Link} size="large" sx={{ mt: 3 }} to="/acceso" variant="contained">Publicar mi club</Button></Grid>
        <Grid size={{ xs: 12, md: 7 }}><Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1.1fr .9fr' } }}><VisualImage featured item={landingImages[0]} /><Stack spacing={2}><VisualImage item={landingImages[1]} /><VisualImage item={landingImages[2]} /></Stack></Box></Grid>
      </Grid>
    </Container>
  </Box>
}

function Footer() {
  return <Box component="footer" sx={{ bgcolor: 'primary.dark', color: 'common.white', py: { xs: 4, md: 5 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={3} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}><Typography sx={{ fontSize: 24, fontWeight: 950 }}>Rapicancha</Typography><Typography sx={{ color: 'rgba(255,255,255,.72)', lineHeight: 1.7, mt: 1 }}>Reservas deportivas, agenda para clubes y herramientas para crecer centros multi-deporte.</Typography></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 1 }}><Typography component="a" href="#buscar" sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }}>Buscar</Typography><Typography component={Link} sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }} to="/acceso">Clubes</Typography><Typography component={Link} sx={{ color: 'common.white', fontWeight: 800, textDecoration: 'none' }} to="/registro">Crear cuenta</Typography></Stack></Grid>
        <Grid size={{ xs: 12, md: 3 }}><Button color="secondary" component="a" fullWidth href="https://wa.me/573148632751?text=Hola%20Rapicancha%2C%20quiero%20informacion" startIcon={<WhatsApp />} target="_blank" variant="contained">WhatsApp</Button></Grid>
      </Grid>
      <Typography sx={{ borderTop: 1, borderColor: 'rgba(255,255,255,.14)', color: 'rgba(255,255,255,.58)', fontSize: 13, mt: 4, pt: 2 }}>2026 Rapicancha. Plataforma SaaS y marketplace deportivo.</Typography>
    </Container>
  </Box>
}

function FloatingActions() {
  return <Stack spacing={1.25} sx={{ bottom: 22, position: 'fixed', right: 22, zIndex: 30 }}>
    <Button aria-label="Subir al inicio" component="a" href="#top" sx={{ borderRadius: '50%', height: 52, minWidth: 0, width: 52 }} variant="contained"><ArrowUpward /></Button>
    <Button aria-label="WhatsApp Rapicancha" color="success" component="a" href="https://wa.me/573148632751?text=Hola%20Rapicancha%2C%20quiero%20informacion" sx={{ borderRadius: '50%', height: 52, minWidth: 0, width: 52 }} target="_blank" variant="contained"><WhatsApp /></Button>
  </Stack>
}

function VisualImage({ featured = false, item }: { featured?: boolean; item: { title: string; text: string; image: string } }) {
  return <Box sx={{ borderRadius: 2, minHeight: featured ? { xs: 260, sm: 460 } : 220, overflow: 'hidden', position: 'relative' }}>
    <Box component="img" src={item.image} sx={{ display: 'block', height: '100%', inset: 0, objectFit: 'cover', position: 'absolute', width: '100%' }} />
    <Box sx={{ background: 'linear-gradient(180deg, rgba(2,44,34,0) 15%, rgba(2,44,34,.88) 100%)', inset: 0, position: 'absolute' }} />
    <Box sx={{ bottom: 0, color: 'common.white', p: 2.5, position: 'absolute' }}><Typography sx={{ fontSize: featured ? 24 : 18, fontWeight: 950 }}>{item.title}</Typography><Typography sx={{ color: 'rgba(255,255,255,.78)', fontSize: 14, mt: 0.5 }}>{item.text}</Typography></Box>
  </Box>
}

function ValueBlock({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}><Box sx={{ bgcolor: 'primary.main', borderRadius: 1.5, color: 'common.white', display: 'grid', flexShrink: 0, height: 48, placeItems: 'center', width: 48 }}>{icon}</Box><Box><Typography sx={{ fontSize: 18, fontWeight: 950 }}>{title}</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.6, mt: 0.75 }}>{text}</Typography></Box></Stack>
}
