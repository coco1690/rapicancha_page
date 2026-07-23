export const supportedPaymentProviders = ['manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe'] as const

export type PaymentProvider = typeof supportedPaymentProviders[number]

export const paymentProviders: PaymentProvider[] = ['epayco', 'manual']

export function isPaymentProvider(value: string | null | undefined): value is PaymentProvider {
  return Boolean(value && supportedPaymentProviders.includes(value as PaymentProvider))
}

export type PaymentProviderAccount = {
  provider: PaymentProvider
  accountId: string | null
  onboardingStatus: string
}

export type PaymentCheckoutRequest = {
  reference: string
  provider: PaymentProvider
  providerAccountId: string | null
  amountMinor: number
  platformFeeMinor: number
  currency: string
  customerEmail: string
  description: string
  successUrl: string
  cancelUrl: string
}

export type PaymentCheckoutResponse = {
  provider: PaymentProvider
  providerPaymentId: string | null
  providerCheckoutId: string | null
  providerCheckoutUrl: string | null
  providerReference: string
  rawPayload: unknown
}

export type PaymentProviderAdapter = {
  provider: PaymentProvider
  createCheckout: (request: PaymentCheckoutRequest) => Promise<PaymentCheckoutResponse>
  parseWebhook: (payload: unknown, headers: Headers) => Promise<PaymentCheckoutResponse>
}

export function getProviderLabel(provider: PaymentProvider | string | null | undefined) {
  switch (provider) {
    case 'mercadopago':
      return 'Mercado Pago'
    case 'epayco':
      return 'ePayco'
    case 'dlocal':
      return 'dLocal'
    case 'wompi':
      return 'Wompi'
    case 'bold':
      return 'Bold'
    case 'stripe':
      return 'Stripe legacy'
    default:
      return 'Manual'
  }
}
