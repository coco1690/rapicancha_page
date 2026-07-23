import { Box, useTheme } from '@mui/material'

type BrandLogoProps = {
  height?: number
  width?: number
}

export function BrandLogo({ height = 46, width }: BrandLogoProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      aria-label="RapiCancha"
      role="img"
      sx={{
        height,
        width: width ?? 'auto',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Box
        alt="RapiCancha"
        component="img"
        src={isDark ? '/logo-rapicancha-dark.png' : '/logo-rapicancha-light.png'}
        sx={{
          display: 'block',
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
          // CSS properties for sharper image scaling
          imageRendering: '-webkit-optimize-contrast',
        }}
      />
    </Box>
  )
}


