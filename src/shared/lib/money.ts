const zeroDecimalCurrencies = new Set([
  'BIF', 'CLP', 'COP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

export function currencyMinorFactor(currency: string) {
  return zeroDecimalCurrencies.has(currency.trim().toUpperCase()) ? 1 : 100
}

export function minorToMajor(amountMinor: number, currency: string) {
  return amountMinor / currencyMinorFactor(currency)
}

export function majorToMinor(amount: number | string, currency: string) {
  return Math.round(Number(amount) * currencyMinorFactor(currency))
}

export function formatMinorMoney(amountMinor: number, currency: string, locale = 'es-CO') {
  const normalizedCurrency = currency.trim().toUpperCase()
  const maximumFractionDigits = currencyMinorFactor(normalizedCurrency) === 1 ? 0 : 2
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(minorToMajor(amountMinor, normalizedCurrency))
}

export function moneyInputStep(currency: string) {
  return currencyMinorFactor(currency) === 1 ? '1' : '0.01'
}
