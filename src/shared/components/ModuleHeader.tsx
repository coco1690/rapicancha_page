import { Box, Stack, Typography } from '@mui/material'

type ModuleHeaderProps = {
  title: string
  section?: string
}

export function ModuleHeader({ title, section = 'Dashboard' }: ModuleHeaderProps) {
  return (
    <Box sx={{ bgcolor: 'primary.main', borderRadius: 1, color: 'primary.contrastText', mb: 3, px: { xs: 2, sm: 2.5 }, py: 2.25 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800 }}>{title}</Typography>
        <Stack direction="row" spacing={1} sx={{ fontSize: 14 }}>
          <Typography sx={{ color: 'inherit', fontSize: 'inherit', fontWeight: 700 }}>{section}</Typography>
          <Typography aria-hidden sx={{ color: 'rgba(255,255,255,.55)', fontSize: 'inherit' }}>/</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.72)', fontSize: 'inherit' }}>{title}</Typography>
        </Stack>
      </Stack>
    </Box>
  )
}
