import type { ReactNode } from 'react'
import { Close, Logout, Menu, NotificationsNone, Search } from '@mui/icons-material'
import { AppBar, Avatar, Badge, Box, Chip, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { useDashboardShellStore } from '../../stores/useDashboardShellStore'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeModeButton } from '../components/ThemeModeButton'

export type DashboardNavItem = { to: string; label: string; icon: ReactNode; group: 'Principal' | 'Gestion' }

type DashboardShellProps = {
  areaLabel: string
  navigation: DashboardNavItem[]
  profileName: string
  profileSubtitle: string
  status?: string
  onSignOut: () => Promise<void>
  alert?: ReactNode
  children: ReactNode
}

const sidebarWidth = 250

export function DashboardShell({ areaLabel, navigation, profileName, profileSubtitle, status, onSignOut, alert, children }: DashboardShellProps) {
  const mobileOpen = useDashboardShellStore((state) => state.mobileOpen)
  const search = useDashboardShellStore((state) => state.search)
  const openMobile = useDashboardShellStore((state) => state.openMobile)
  const closeMobile = useDashboardShellStore((state) => state.closeMobile)
  const setSearch = useDashboardShellStore((state) => state.setSearch)
  const location = useLocation()
  const term = search.trim().toLocaleLowerCase('es')
  const visibleNavigation = navigation.filter((item) => !term || item.label.toLocaleLowerCase('es').includes(term))

  const sidebar = <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column', bgcolor: 'background.paper' }}>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 64, px: 2 }}>
      <Stack spacing={0.25}>
        <BrandLogo height={38} width={164} />
        <Typography color="text.secondary" sx={{ pl: 0.75, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{areaLabel}</Typography>
      </Stack>
      <IconButton aria-label="Cerrar menu" onClick={closeMobile} sx={{ display: { md: 'none' } }}><Close /></IconButton>
    </Stack>
    <Divider />
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, py: 2 }}>
      {(['Principal', 'Gestion'] as const).map((group) => {
        const items = visibleNavigation.filter((item) => item.group === group)
        if (!items.length) return null
        return <List key={group} subheader={<ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'text.secondary', fontSize: 10, fontWeight: 900, lineHeight: '34px', textTransform: 'uppercase' }}>{group}</ListSubheader>}>
          {items.map((item) => { const active = item.to.endsWith('/admin') || item.to.endsWith('/negocio') ? location.pathname === item.to : location.pathname.startsWith(item.to); return <ListItemButton component={Link} key={item.to} onClick={closeMobile} selected={active} sx={{ mb: 0.5, minHeight: 44, borderRadius: 1, '&.Mui-selected': { bgcolor: 'primary.main', color: 'common.white' }, '&.Mui-selected:hover': { bgcolor: 'primary.dark' } }} to={item.to}><ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: 21 } }}>{item.icon}</ListItemIcon><ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 800 : 600 } } }} /></ListItemButton> })}
        </List>
      })}
    </Box>
    <Divider />
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', p: 2 }}>
      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 800 }}>{profileName.slice(0, 1).toUpperCase()}</Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>{profileName}</Typography><Typography noWrap color="text.secondary" variant="caption">{profileSubtitle}</Typography></Box>
      <Tooltip title="Cerrar sesion"><IconButton aria-label="Cerrar sesion" onClick={() => void onSignOut()} size="small"><Logout fontSize="small" /></IconButton></Tooltip>
    </Stack>
  </Box>

  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Drawer open={mobileOpen} onClose={closeMobile} slotProps={{ paper: { sx: { width: sidebarWidth } } }} sx={{ display: { xs: 'block', md: 'none' } }}>{sidebar}</Drawer>
    <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', inset: '0 auto 0 0', zIndex: 1200, width: sidebarWidth, borderRight: 1, borderColor: 'divider' }}>{sidebar}</Box>
    <AppBar color="inherit" elevation={0} position="fixed" sx={{ width: { md: `calc(100% - ${sidebarWidth}px)` }, ml: { md: `${sidebarWidth}px` }, borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ minHeight: 64, gap: 1.5 }}>
        <IconButton aria-label="Abrir menu" onClick={openMobile} sx={{ display: { md: 'none' } }}><Menu /></IconButton>
        <Box sx={{ display: 'flex', width: { xs: '100%', sm: 260 }, maxWidth: 360, alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default', px: 1.25 }}><Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /><InputBase fullWidth placeholder="Buscar modulo..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ fontSize: 14 }} /></Box>
        <Box sx={{ flex: 1 }} />
        {status && <Chip label={status} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
        <ThemeModeButton />
        <Tooltip title="Notificaciones"><IconButton aria-label="Notificaciones"><Badge color="error" variant="dot"><NotificationsNone /></Badge></IconButton></Tooltip>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', color: 'primary.dark', fontSize: 13, fontWeight: 900 }}>{profileName.slice(0, 1).toUpperCase()}</Avatar>
      </Toolbar>
    </AppBar>
    <Box sx={{ ml: { md: `${sidebarWidth}px` }, pt: '64px', minWidth: 0 }}>{alert}{children}</Box>
  </Box>
}
