import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { Link, Outlet } from 'react-router-dom'
import { ThemeModeButton } from '../components/ThemeModeButton'

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar color="inherit" elevation={0} position="static" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 68, justifyContent: 'space-between' }}>
            <Link style={{ textDecoration: 'none' }} to="/"><Typography color="primary" sx={{ fontSize: '1.25rem', fontWeight: 900 }}>Rapicancha</Typography></Link>
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
