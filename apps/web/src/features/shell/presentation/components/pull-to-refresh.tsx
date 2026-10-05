'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'

/** How far the page has to come down before letting go refreshes it. */
export const PULL_THRESHOLD = 70

/** The page follows the finger at half speed, and no further than half again past the threshold. */
export const pullDistance = (fingerTravel: number): number =>
  Math.min(Math.max(fingerTravel, 0) / 2, PULL_THRESHOLD * 1.5)

/**
 * Pull down from the top of a screen to read it again.
 *
 * An installed iOS app has no browser refresh, so this is the only way to
 * ask for fresh data short of closing the app. It engages only from the very
 * top, so an ordinary scroll back up never triggers it.
 */
export const PullToRefresh = ({
  onRefresh,
  children,
}: {
  readonly onRefresh: () => Promise<void>
  readonly children: ReactNode
}) => {
  const start = useRef<number | null>(null)
  // The latest pull, read on release: a fast flick can end before React re-renders.
  const pulled = useRef(0)
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const release = () => {
    const reached = pulled.current >= PULL_THRESHOLD
    start.current = null
    pulled.current = 0
    setDistance(0)
    if (!reached || refreshing) return

    setRefreshing(true)
    void onRefresh().finally(() => setRefreshing(false))
  }

  return (
    <div
      onTouchStart={(event) => {
        start.current = window.scrollY <= 0 ? (event.touches[0]?.clientY ?? null) : null
      }}
      onTouchMove={(event) => {
        if (start.current === null) return
        pulled.current = pullDistance((event.touches[0]?.clientY ?? start.current) - start.current)
        setDistance(pulled.current)
      }}
      onTouchEnd={release}
      onTouchCancel={release}
    >
      <div
        aria-hidden={!refreshing}
        className="flex items-end justify-center overflow-hidden text-muted-foreground transition-[height]"
        style={{ height: refreshing ? 48 : distance }}
      >
        {refreshing ? (
          <span role="status" className="sr-only">
            Refreshing
          </span>
        ) : null}
        {refreshing ? (
          <Loader2 className="mb-3 size-5 animate-spin" aria-hidden="true" />
        ) : (
          distance > 0 && (
            <RefreshCw
              className="mb-3 size-5"
              aria-hidden="true"
              style={{ transform: `rotate(${(distance / PULL_THRESHOLD) * 270}deg)` }}
            />
          )
        )}
      </div>
      {children}
    </div>
  )
}
