import type { ReactNode } from 'react'
import { DeleteOutlined, EditOutlined, MoreVert, PersonOutlined, SettingsOutlined } from '@mui/icons-material'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import { useRowActionsMenuStore } from '../../stores/useRowActionsMenuStore'

export type RowAction = {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  icon?: ReactNode
}

export function RowActionsMenu({ rowId, actions }: { rowId: string; actions: RowAction[] }) {
  const activeRowId = useRowActionsMenuStore((state) => state.rowId)
  const anchorEl = useRowActionsMenuStore((state) => state.anchorEl)
  const open = useRowActionsMenuStore((state) => state.open)
  const close = useRowActionsMenuStore((state) => state.close)
  const isOpen = activeRowId === rowId

  return (
    <>
      <Box component="span" sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}><Tooltip title="Acciones"><IconButton aria-label="Abrir acciones" size="small" onClick={(event) => open(rowId, event.currentTarget)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'primary.light', color: 'primary.dark' } }}><MoreVert /></IconButton></Tooltip></Box>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={close} slotProps={{ paper: { sx: { border: 1, borderColor: 'divider', boxShadow: '0 14px 36px rgba(17, 34, 30, .16)', minWidth: 180, mt: 0.5, p: 0.5 } } }}>
        {actions.map((action) => <MenuItem disabled={action.disabled} key={action.label} onClick={() => { close(); action.onClick() }} sx={{ borderRadius: 0.75, color: action.destructive ? 'error.main' : 'text.primary', gap: 1, minHeight: 40, px: 1.25, py: 0.75 }}><ListItemIcon sx={{ color: 'inherit', minWidth: '30px !important' }}>{action.icon ?? actionIcon(action.label)}</ListItemIcon><ListItemText slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }}>{action.label}</ListItemText></MenuItem>)}
      </Menu>
    </>
  )
}

function actionIcon(label: string) {
  const normalized = label.toLocaleLowerCase('es')
  if (normalized.includes('eliminar') || normalized.includes('cancelar')) return <DeleteOutlined fontSize="small" />
  if (normalized.includes('rol')) return <PersonOutlined fontSize="small" />
  if (normalized.includes('editar')) return <EditOutlined fontSize="small" />
  return <SettingsOutlined fontSize="small" />
}
