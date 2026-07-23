import { registerSW } from 'virtual:pwa-register'

const UPDATE_INTERVAL_MS = 15 * 60 * 1000

export function registerPwa() {
  let updateServiceWorker: ReturnType<typeof registerSW>

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      void updateServiceWorker(true)
    },
    onRegisteredSW: (_serviceWorkerUrl, registration) => {
      if (!registration) return

      const checkForUpdate = () => {
        if (navigator.onLine) {
          void registration.update()
        }
      }

      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS)
      window.addEventListener('online', checkForUpdate)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
    },
  })
}

export async function refreshInstalledPwa() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) await registration.update()
  }

  await new Promise((resolve) => window.setTimeout(resolve, 350))
  window.location.reload()
}
