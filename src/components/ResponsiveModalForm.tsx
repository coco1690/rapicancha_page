import type { FormEventHandler, ReactNode } from 'react'
import { Close } from '@mui/icons-material'
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'

type ResponsiveModalFormProps = {
  title: string
  kicker?: string
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  children: ReactNode
  actions: ReactNode
  ariaLabel?: string
  size?: 'sm' | 'md'
}

export function ResponsiveModalForm({ title, kicker, onClose, onSubmit, children, actions, ariaLabel, size = 'md' }: ResponsiveModalFormProps) {
  return (
    <Dialog
      aria-label={ariaLabel ?? title}
      fullWidth
      maxWidth={size}
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { m: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'calc(100% - 32px)' }, maxHeight: { xs: '100dvh', sm: 'calc(100dvh - 32px)' }, height: { xs: '100dvh', sm: 'auto' }, borderRadius: { xs: 0, sm: 1 } } } }}
    >
      <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column' }}>
        <DialogTitle component="div" sx={{ borderBottom: 1, borderColor: 'divider', pr: 7 }}>
          <Stack>
            {kicker && <Typography color="primary" sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{kicker}</Typography>}
            <Typography component="h2" variant="h3">{title}</Typography>
          </Stack>
          <IconButton aria-label="Cerrar" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default', minHeight: 0, py: 3 }}>{children}</DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1, px: 3, py: 2, '& > :not(style)': { m: 0, width: { xs: '100%', sm: 'auto' } } }}>{actions}</DialogActions>
      </Box>
    </Dialog>
  )
}
