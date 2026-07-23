type EpaycoCheckoutInstance = {
  setHooks: (hooks: { onCreated?: (data: unknown) => void; onResponse?: (data: unknown) => void; onErrors?: (error: unknown) => void; onClosed?: (error?: unknown) => void }) => void
  open: () => void
}

type EpaycoGlobal = {
  checkout: {
    configure: (config: { sessionId: string; type: 'onpage' | 'standard'; test: boolean }) => EpaycoCheckoutInstance
  }
}

declare global {
  interface Window {
    ePayco?: EpaycoGlobal
  }
}

let scriptPromise: Promise<void> | null = null

export async function openEpaycoCheckout(input: { sessionId: string; test: boolean; onResponse: (data: unknown) => void; onClosed: () => void; onError: (message: string) => void }) {
  await loadEpaycoScript()
  const checkout = window.ePayco?.checkout.configure({ sessionId: input.sessionId, type: 'onpage', test: input.test })
  if (!checkout) throw new Error('No se pudo inicializar ePayco.')
  checkout.setHooks({
    onResponse: input.onResponse,
    onErrors: () => input.onError('ePayco reporto un error al abrir el pago.'),
    onClosed: input.onClosed,
  })
  checkout.open()
}

function loadEpaycoScript() {
  if (window.ePayco) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.epayco.co/checkout-v2.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de ePayco.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}
