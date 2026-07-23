import { AppBar, Box, Button, Container, Stack, Toolbar } from '@mui/material'
import { Link, Outlet } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeModeButton } from '../components/ThemeModeButton'

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar color="inherit" elevation={0} position="static" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 68, justifyContent: 'space-between' }}>
            <Link aria-label="Ir al inicio de RapiCancha" style={{ display: 'inline-flex', textDecoration: 'none' }} to="/">
              <BrandLogo height={44} width={190} />
            </Link>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ThemeModeButton />
              <Button component={Link} to="/acceso" variant="contained">Soy un club</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Outlet />
    </Box>
  )
}
