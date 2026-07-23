import type { ReactNode } from 'react'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

type AdminTableShellProps = {
  title: string
  actions?: ReactNode
  filters?: ReactNode
  children: ReactNode
}

export function AdminTableShell({ title, actions, filters, children }: AdminTableShellProps) {
  return (
    <Card sx={{ borderColor: 'divider', boxShadow: '0 12px 32px rgba(23, 43, 38, .06)', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 2.75 }, py: 2.25 }}>
          <Box aria-hidden sx={{ bgcolor: 'primary.main', borderRadius: 1, height: 22, width: 4 }} />
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800 }}>{title}</Typography>
        </Stack>
        {(filters || actions) && <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between', px: { xs: 2, sm: 2.75 }, py: 2, '& .MuiTextField-root': { minWidth: { sm: 260 } } }}>{filters ?? <Box />}{actions}</Stack>}
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: { xs: 2, sm: 2.75 }, mx: { xs: 2, sm: 2.75 }, overflow: 'hidden' }}>{children}</Box>
      </CardContent>
    </Card>
  )
}
