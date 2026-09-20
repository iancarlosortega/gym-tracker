'use client'

import { useEffect, useState } from 'react'
import { AddToHomeHint } from '../components/add-to-home-hint'

const DISMISSED_KEY = 'gym-tracker.home-screen-hint-dismissed'

/**
 * Registers the service worker and offers the install hint once.
 *
 * The hint is hidden when the app is already running standalone, since it
 * would then be teaching a gesture the user has plainly already made. The
 * dismissal is remembered in localStorage rather than the queue's database:
 * losing it costs one redundant hint, and the queue is not a place for
 * preferences.
 */
export const PwaShellContainer = () => {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // A failed registration is not worth a message: the app works without it.
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const installed = globalThis.matchMedia?.('(display-mode: standalone)').matches === true
    const dismissed = readDismissed()

    setShowHint(!installed && !dismissed)
  }, [])

  if (!showHint) {
    return null
  }

  return (
    <AddToHomeHint
      onDismiss={() => {
        setShowHint(false)
        try {
          globalThis.localStorage?.setItem(DISMISSED_KEY, 'true')
        } catch {
          // Private mode can refuse storage; the hint simply returns later.
        }
      }}
    />
  )
}

const readDismissed = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}
