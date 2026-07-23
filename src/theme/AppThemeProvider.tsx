import { useEffect, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { useThemeStore } from '../stores/useThemeStore'
import { darkTheme, lightTheme } from './createAppTheme'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode)

  useEffect(() => {
    document.documentElement.dataset.colorMode = mode
    document.documentElement.style.colorScheme = mode
  }, [mode])

  return <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}><CssBaseline />{children}</ThemeProvider>
}
