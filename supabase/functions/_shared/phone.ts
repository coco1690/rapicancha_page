const e164Pattern = /^\+[1-9][0-9]{7,14}$/

export function normalizeE164(phone: string, callingPrefix?: string | null) {
  const trimmed = phone.trim()
  if (!trimmed) return null

  const explicit = trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : ''
  if (explicit) return e164Pattern.test(explicit) ? explicit : null

  const prefix = callingPrefix?.trim().replace(/[^\d+]/g, '') ?? ''
  if (!prefix) return null
  const normalizedPrefix = prefix.startsWith('+') ? prefix : `+${prefix}`
  const nationalNumber = trimmed.replace(/\D/g, '').replace(/^0+/, '')
  const value = `${normalizedPrefix}${nationalNumber}`
  return e164Pattern.test(value) ? value : null
}

export function whatsappAddress(phone: string) {
  if (!e164Pattern.test(phone)) throw new Error('El numero WhatsApp no tiene formato E.164.')
  return `whatsapp:${phone}`
}
