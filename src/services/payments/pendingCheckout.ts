export type PendingCheckout = {
  reference: string
  courtId: string
  date: string
  time: string
  returnTo: string
  courtName?: string
  priceMinor?: number
  platformFeeMinor?: number
  processingFeeMinor?: number
  totalMinor?: number
  currency?: string
  sessionId: string
  test: boolean
  createdAt: number
  customerName?: string
  customerPhone?: string
  customerPhoneCountryCode?: string
  customerEmail?: string
  acceptsMarketing?: boolean
  acceptsWhatsApp?: boolean
  acceptsTerms?: boolean
  termsVersion?: string
}

const storageKey = 'rapicancha:pending-checkouts'
export const bookingHoldMs = 7 * 60 * 1000

export function savePendingCheckout(value: PendingCheckout) {
  const items = activePendingCheckouts().filter((item) => item.reference !== value.reference && slotKey(item) !== slotKey(value))
  items.push(value)
  localStorage.setItem(storageKey, JSON.stringify(items))
}

export function findPendingCheckoutForSlot(courtId: string, date: string, time: string) {
  return activePendingCheckouts().find((item) => item.courtId === courtId && item.date === date && item.time === time) ?? null
}

export function findPendingCheckoutByReference(reference: string) {
  return activePendingCheckouts().find((item) => item.reference === reference) ?? null
}

export function findPendingCheckoutsForCourts(courtIds: string[]) {
  const allowedCourts = new Set(courtIds)
  return activePendingCheckouts().filter((item) => allowedCourts.has(item.courtId))
}

export function clearPendingCheckout(reference: string) {
  localStorage.setItem(storageKey, JSON.stringify(activePendingCheckouts().filter((item) => item.reference !== reference)))
}

export function pendingCheckoutTimeLeftMs(createdAt: number) {
  return Math.max(0, bookingHoldMs - (Date.now() - createdAt))
}

function activePendingCheckouts() {
  const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as PendingCheckout[]
  const active = parsed.filter((item) => item.reference && item.sessionId && pendingCheckoutTimeLeftMs(item.createdAt) > 0)
  if (active.length !== parsed.length) localStorage.setItem(storageKey, JSON.stringify(active))
  return active
}

function slotKey(value: Pick<PendingCheckout, 'courtId' | 'date' | 'time'>) {
  return `${value.courtId}:${value.date}:${value.time}`
}
