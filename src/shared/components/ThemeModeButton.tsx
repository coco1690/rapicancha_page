import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
import { useThemeStore } from '../../stores/useThemeStore'

export function ThemeModeButton() {
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)
  const label = mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'

  return <Tooltip title={label}><IconButton aria-label={label} color="inherit" onClick={toggleMode}>{mode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}</IconButton></Tooltip>
}
