"use client"

import { ReactNode, useSyncExternalStore } from 'react'

interface NoSSRProps {
  children: ReactNode
}

function subscribe() {
  return () => {}
}

export default function NoSSR({ children }: NoSSRProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  if (!isClient) return null

  return <>{children}</>
}
