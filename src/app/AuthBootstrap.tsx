import { useEffect, type PropsWithChildren } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

export function AuthBootstrap({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => initialize(), [initialize])

  return children
}
