import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useId } from 'react'
import type { Pais } from '../../services/supabase/tables'
import { sanitizeNationalPhone } from '../lib/phone'
import { CountryFlag } from './CountryFlag'

type InternationalPhoneFieldProps = {
  countries: Pais[]
  countryCode: string
  phone: string
  onCountryChange: (countryCode: string) => void
  onPhoneChange: (phone: string) => void
  label?: string
  required?: boolean
  disabled?: boolean
}

export function InternationalPhoneField({
  countries,
  countryCode,
  phone,
  onCountryChange,
  onPhoneChange,
  label = 'Telefono',
  required = false,
  disabled = false,
}: InternationalPhoneFieldProps) {
  const inputId = useId()
  const availableCountries = countries.filter((country) => country.activo && country.indicativo_pais)
  const selectedCountry = availableCountries.find((country) => country.codigo_iso2 === countryCode)

  return <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '116px minmax(0, 1fr)', sm: '140px minmax(0, 1fr)' }, minWidth: 0, width: '100%' }}>
    <FormControl disabled={disabled} fullWidth required={required} size="small">
      <InputLabel id={`${inputId}-calling-code-label`}>Indicativo</InputLabel>
      <Select
        label="Indicativo"
        labelId={`${inputId}-calling-code-label`}
        onChange={(event) => onCountryChange(event.target.value)}
        renderValue={() => selectedCountry
          ? <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <CountryFlag code={selectedCountry.codigo_iso2} />
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{selectedCountry.indicativo_pais}</Typography>
            </Stack>
          : countryCode}
        value={countryCode}
      >
        {availableCountries.map((country) => <MenuItem key={country.id} value={country.codigo_iso2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <CountryFlag code={country.codigo_iso2} />
            <Typography noWrap sx={{ flex: 1, fontSize: 14 }}>{country.nombre}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>{country.indicativo_pais}</Typography>
          </Stack>
        </MenuItem>)}
      </Select>
    </FormControl>
    <TextField
      autoComplete="tel-national"
      disabled={disabled}
      fullWidth
      inputMode="tel"
      label={label}
      onChange={(event) => onPhoneChange(sanitizeNationalPhone(event.target.value))}
      required={required}
      size="small"
      slotProps={{ htmlInput: { maxLength: 15 } }}
      type="tel"
      value={phone}
    />
  </Box>
}
