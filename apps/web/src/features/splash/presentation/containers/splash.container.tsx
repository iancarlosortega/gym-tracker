'use client'

import { useEffect, useState } from 'react'
import { type SplashDock, type SplashPhase, SplashScreen } from '../components/splash-screen'

/** When the bars have risen and the dumbbell has done its rep, counted from the page's start. */
const CONTRACT_AT = 950
/** The tile's size on screen once the amber has shrunk into it. */
const TILE = 112
/** How long each closing phase runs in globals.css, plus a frame to spare. */
const CLOSING_MS = { dock: 1000, vanish: 750, fade: 220 } as const

const matches = (query: string): boolean => globalThis.matchMedia?.(query).matches === true

/** The central tab-bar action, when this screen has one to land on. */
const findDock = (): SplashDock | undefined => {
  const rect = document.querySelector('[data-splash-dock]')?.getBoundingClientRect()
  if (!rect || rect.width === 0) {
    return undefined
  }
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, scale: rect.width / TILE }
}

/**
 * Plays the launch once per page load. The rise starts in CSS from the first
 * paint, before any script runs; this takes over from there, shrinking the
 * amber into the icon tile and docking it into the central action. The root
 * layout stays mounted across navigations, so it never replays until the app
 * is opened again.
 */
export const SplashContainer = () => {
  const [phase, setPhase] = useState<SplashPhase | 'done' | null>(null)
  const [dock, setDock] = useState<SplashDock>()

  useEffect(() => {
    if (!matches('(display-mode: standalone)')) {
      setPhase('done')
      return
    }
    if (matches('(prefers-reduced-motion: reduce)')) {
      setPhase('fade')
      return
    }

    setPhase('rise')
    const timer = setTimeout(
      () => {
        const target = findDock()
        setDock(target)
        setPhase(target ? 'dock' : 'vanish')
      },
      Math.max(0, CONTRACT_AT - performance.now()),
    )
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (phase === 'dock' || phase === 'vanish' || phase === 'fade') {
      const timer = setTimeout(() => setPhase('done'), CLOSING_MS[phase])
      return () => clearTimeout(timer)
    }
  }, [phase])

  if (phase === 'done') {
    return null
  }

  return <SplashScreen phase={phase} dock={dock} />
}
