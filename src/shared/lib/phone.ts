import type { Pais } from '../../services/supabase/tables'

export type PhoneCountry = Pick<Pais, 'codigo_iso2' | 'indicativo_pais' | 'nombre'>

export function sanitizeNationalPhone(value: string) {
  return value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 15)
}

export function toE164(countryCode: string, nationalPhone: string, countries: PhoneCountry[]) {
  const callingCode = countries.find((country) => country.codigo_iso2 === countryCode)?.indicativo_pais
  const national = sanitizeNationalPhone(nationalPhone)
  if (!callingCode || !national) return ''
  const value = `${callingCode}${national}`
  return /^\+[1-9][0-9]{7,14}$/.test(value) ? value : ''
}

export function splitPhone(value: string | null | undefined, countries: PhoneCountry[], fallbackCountryCode = 'CO') {
  const normalized = value?.trim() ?? ''
  const fallback = countries.find((country) => country.codigo_iso2 === fallbackCountryCode)
    ?? countries.find((country) => Boolean(country.indicativo_pais))
  if (!normalized.startsWith('+')) {
    return {
      countryCode: fallback?.codigo_iso2 ?? fallbackCountryCode,
      nationalPhone: sanitizeNationalPhone(normalized),
    }
  }

  const candidates = countries
    .filter((country) => Boolean(country.indicativo_pais))
    .sort((left, right) => {
      if (left.codigo_iso2 === fallbackCountryCode) return -1
      if (right.codigo_iso2 === fallbackCountryCode) return 1
      return (right.indicativo_pais?.length ?? 0) - (left.indicativo_pais?.length ?? 0)
    })
  const country = candidates.find((item) => normalized.startsWith(item.indicativo_pais ?? ''))
  return {
    countryCode: country?.codigo_iso2 ?? fallback?.codigo_iso2 ?? fallbackCountryCode,
    nationalPhone: sanitizeNationalPhone(country?.indicativo_pais ? normalized.slice(country.indicativo_pais.length) : normalized),
  }
}

export function isValidE164(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value)
}
