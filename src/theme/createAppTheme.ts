import { createTheme, type PaletteMode } from '@mui/material/styles'
import { colorScales, themeSettings } from './tokens'

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: { light: themeSettings.primaryScale[400], main: themeSettings.primaryScale[700], dark: themeSettings.primaryScale[900], contrastText: '#ffffff' },
      secondary: { light: themeSettings.secondaryScale[300], main: themeSettings.secondaryScale[400], dark: themeSettings.secondaryScale[600], contrastText: '#123f3a' },
      success: colorScales.success,
      warning: colorScales.warning,
      error: colorScales.error,
      info: colorScales.info,
      background: { default: dark ? '#111716' : '#f6f7f7', paper: dark ? '#19211f' : '#ffffff' },
      text: { primary: dark ? colorScales.neutral[50] : colorScales.neutral[900], secondary: dark ? colorScales.neutral[400] : colorScales.neutral[600] },
      divider: dark ? colorScales.neutral[800] : colorScales.neutral[200],
    },
    shape: { borderRadius: themeSettings.borderRadius },
    typography: {
      fontFamily: themeSettings.fontFamily,
      h1: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 },
      h2: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25 },
      h3: { fontSize: '1.125rem', fontWeight: 800 },
      button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 40, borderRadius: themeSettings.borderRadius, paddingInline: 16 } } },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiFormControl: { defaultProps: { size: 'small', fullWidth: true } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { styleOverrides: { root: { border: `1px solid ${dark ? '#293330' : '#e4e8e7'}`, boxShadow: dark ? 'none' : '0 8px 24px rgba(24, 95, 85, 0.04)' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: themeSettings.borderRadius } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 700 }, sizeSmall: { fontSize: '0.72rem', height: 25 } } },
      MuiTable: { styleOverrides: { root: { borderCollapse: 'separate', borderSpacing: 0 } } },
      MuiTableCell: { styleOverrides: { root: { borderBottomColor: dark ? '#293330' : '#e8ecea', letterSpacing: 0, padding: '14px 18px' }, head: { backgroundColor: dark ? '#202a27' : '#f3f5f4', color: dark ? colorScales.neutral[300] : colorScales.neutral[600], fontSize: '0.78rem', fontWeight: 750, lineHeight: 1.3, paddingBottom: 13, paddingTop: 13, textTransform: 'none' }, body: { color: dark ? colorScales.neutral[100] : colorScales.neutral[800], fontSize: '0.875rem' } } },
      MuiTableRow: { styleOverrides: { root: { transition: 'background-color 140ms ease', '&:last-child td': { borderBottom: 0 }, '&.MuiTableRow-hover:hover': { backgroundColor: dark ? 'rgba(118, 197, 182, .07)' : '#f8fbfa' } } } },
      MuiTableContainer: { styleOverrides: { root: { scrollbarColor: `${dark ? '#47524f' : '#c9d1ce'} transparent`, scrollbarWidth: 'thin' } } },
      MuiTablePagination: { styleOverrides: { root: { borderTop: `1px solid ${dark ? '#293330' : '#e8ecea'}` }, toolbar: { minHeight: 58, paddingInline: 16 }, selectLabel: { color: dark ? colorScales.neutral[400] : colorScales.neutral[600], fontSize: '0.78rem' }, displayedRows: { color: dark ? colorScales.neutral[400] : colorScales.neutral[600], fontSize: '0.78rem' } } },
      MuiSwitch: { styleOverrides: { root: { height: 34, padding: 7, width: 52 }, switchBase: { padding: 9, '&.Mui-checked': { color: '#ffffff', transform: 'translateX(18px)', '& + .MuiSwitch-track': { backgroundColor: themeSettings.primaryScale[700], opacity: 1 } } }, thumb: { boxShadow: '0 1px 4px rgba(0,0,0,.24)', height: 16, width: 16 }, track: { backgroundColor: dark ? '#4b5552' : '#cbd2d0', borderRadius: 10, opacity: 1 } } },
      MuiToggleButton: { styleOverrides: { root: { borderRadius: 6, fontWeight: 700, letterSpacing: 0, '&.Mui-selected': { backgroundColor: themeSettings.primaryScale[700], color: '#ffffff', '&:hover': { backgroundColor: themeSettings.primaryScale[800] } } } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: themeSettings.borderRadius } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: themeSettings.borderRadius, fontWeight: 600 } } },
    },
  })
}

export const lightTheme = createAppTheme('light')
export const darkTheme = createAppTheme('dark')
