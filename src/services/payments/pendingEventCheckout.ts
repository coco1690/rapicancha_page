import type { EventCheckout, EventRegistrationReceipt } from '../repositories/eventRepository'

const storageKey = 'rapicancha.pending-event-checkout'

export type PendingEventCheckout = {
  businessSlug: string
  eventSlug: string
  modalityId: string
  receipt: EventRegistrationReceipt
  checkout: EventCheckout | null
}

export function savePendingEventCheckout(value: PendingEventCheckout) {
  window.localStorage.setItem(storageKey, JSON.stringify(value))
}

export function readPendingEventCheckout(businessSlug: string, eventSlug: string) {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const value = JSON.parse(raw) as PendingEventCheckout
    if (value.businessSlug !== businessSlug || value.eventSlug !== eventSlug || new Date(value.receipt.expira_en).getTime() <= Date.now()) {
      window.localStorage.removeItem(storageKey)
      return null
    }
    return value
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function clearPendingEventCheckout(reference?: string) {
  if (!reference) return window.localStorage.removeItem(storageKey)
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return
  try {
    const value = JSON.parse(raw) as PendingEventCheckout
    if (value.receipt.referencia_publica === reference) window.localStorage.removeItem(storageKey)
  } catch {
    window.localStorage.removeItem(storageKey)
  }
}
