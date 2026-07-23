export const colorScales = {
  brand: {
    50: '#edf8f5', 100: '#d5eee8', 200: '#a9ddd1', 300: '#76c5b6', 400: '#45aa99',
    500: '#278c7d', 600: '#1d7468', 700: '#185f55', 800: '#154d47', 900: '#123f3a',
  },
  accent: {
    50: '#f8ffe9', 100: '#efffc7', 200: '#dfff98', 300: '#caff69', 400: '#b7f56a',
    500: '#98dc3f', 600: '#73b421', 700: '#57891d', 800: '#476d1d', 900: '#3d5c1d',
  },
  neutral: {
    50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa',
    500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b',
  },
  success: { light: '#4ade80', main: '#16a34a', dark: '#166534' },
  warning: { light: '#fbbf24', main: '#d97706', dark: '#92400e' },
  error: { light: '#f87171', main: '#dc2626', dark: '#991b1b' },
  info: { light: '#38bdf8', main: '#0284c7', dark: '#075985' },
} as const

export const themeSettings = {
  primaryScale: colorScales.brand,
  secondaryScale: colorScales.accent,
  borderRadius: 8,
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
} as const
