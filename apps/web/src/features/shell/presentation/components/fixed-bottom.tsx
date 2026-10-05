'use client'

import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'

/**
 * Pinned to the bottom of the screen with `position: fixed`, not sticky.
 *
 * A sticky bar sits at the end of a `100dvh` box, and an installed iOS app
 * reports that height short until the first scroll, leaving the tabs floating
 * above the home bar. The spacer keeps exactly the bar's height clear, and
 * follows it when the workout mini bar appears.
 */
export const FixedBottom = ({ children }: { readonly children: ReactNode }) => {
  const bar = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const element = bar.current
    if (element === null) return

    const measure = () => setHeight(element.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div data-slot="fixed-bottom-spacer" aria-hidden="true" style={{ height }} />
      <div ref={bar} className="fixed inset-x-0 bottom-0 z-40">
        {children}
      </div>
    </>
  )
}
