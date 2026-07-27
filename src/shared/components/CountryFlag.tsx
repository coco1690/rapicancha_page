import { Box } from '@mui/material'

export function CountryFlag({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' }) {
  const width = size === 'md' ? 28 : 22
  const height = size === 'md' ? 21 : 16
  return <Box
    alt=""
    aria-hidden="true"
    component="img"
    loading="lazy"
    src={`https://flagcdn.io/flags/4x3/${code.toLowerCase()}.svg`}
    sx={{ border: 1, borderColor: 'divider', borderRadius: 0.5, flexShrink: 0, height, objectFit: 'cover', width }}
  />
}
