import { SportsBasketballOutlined, SportsSoccerOutlined, SportsTennisOutlined, SportsVolleyballOutlined } from '@mui/icons-material'
import { SvgIcon, type SvgIconProps } from '@mui/material'

const normalizeSport = (value?: string | null) => (value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

export function SportIcon({ sport, ...props }: SvgIconProps & { sport?: string | null }) {
  const value = normalizeSport(sport)
  if (value.includes('padel')) return <PadelRacketIcon {...props} />
  if (value.includes('tenis') || value.includes('tennis')) return <SportsTennisOutlined {...props} />
  if (value.includes('voley') || value.includes('volley')) return <SportsVolleyballOutlined {...props} />
  if (value.includes('basket') || value.includes('baloncesto')) return <SportsBasketballOutlined {...props} />
  if (value.includes('futbol') || value.includes('football') || value.includes('soccer')) return <SportsSoccerOutlined {...props} />
  return <SportsSoccerOutlined {...props} />
}

function PadelRacketIcon(props: SvgIconProps) {
  return <SvgIcon viewBox="0 0 24 24" {...props}>
    <path fillRule="evenodd" d="M12 2.25c-4.07 0-7.38 3.02-7.38 6.75 0 2.79 1.74 5.2 4.25 6.22l1.8 2.6v3.08c0 .47.38.85.85.85h.96c.47 0 .85-.38.85-.85v-3.08l1.8-2.6c2.51-1.02 4.25-3.43 4.25-6.22 0-3.73-3.31-6.75-7.38-6.75Zm-.44 13.25-1-1.43-.22-.08C8.14 13.2 6.62 11.28 6.62 9c0-2.62 2.4-4.75 5.38-4.75S17.38 6.38 17.38 9c0 2.28-1.52 4.2-3.72 4.99l-.22.08-1 1.43h-.88Zm-2.31-7.75a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.75 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.75 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm-4.88 2.05a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.13 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.13 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm-4.88 2.05a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.75 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm2.75 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm-3.38 2a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Zm1.26 0a.55.55 0 1 0 0-1.1.55.55 0 0 0 0 1.1Z" clipRule="evenodd" />
  </SvgIcon>
}
