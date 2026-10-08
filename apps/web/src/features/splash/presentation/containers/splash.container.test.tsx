/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SplashContainer } from './splash.container.tsx'

const STANDALONE = '(display-mode: standalone)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const matching = (...queries: string[]) => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: queries.includes(query) }))
}

const addDockTarget = (rect: Partial<DOMRect>) => {
  const target = document.createElement('button')
  target.setAttribute('data-splash-dock', '')
  target.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 0, height: 0, ...rect }) as DOMRect
  document.body.append(target)
}

const splash = (container: HTMLElement) => container.querySelector<HTMLElement>('.splash')

beforeEach(() => {
  vi.useFakeTimers()
  // The page has been alive 100ms when the app hydrates.
  vi.spyOn(performance, 'now').mockReturnValue(100)
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SplashContainer', () => {
  it('gets out of the way in a browser tab', () => {
    matching()
    const { container } = render(<SplashContainer />)

    expect(splash(container)).toBeNull()
  })

  it('lets the bars rise before it moves', () => {
    matching(STANDALONE)
    addDockTarget({ left: 163, top: 754, width: 64, height: 64 })
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(849))

    expect(splash(container)?.dataset.phase).toBe('rise')
  })

  it('docks into the central action once the bars have risen, 950ms after the page began', () => {
    matching(STANDALONE)
    addDockTarget({ left: 163, top: 754, width: 64, height: 64 })
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(850))
    const root = splash(container)

    expect(root?.dataset.phase).toBe('dock')
    expect(root?.style.getPropertyValue('--dock-x')).toBe('195px')
    expect(root?.style.getPropertyValue('--dock-y')).toBe('786px')
    expect(root?.style.getPropertyValue('--dock-scale')).toBe(String(64 / 112))
  })

  it('is gone once the tile has handed off to the button', () => {
    matching(STANDALONE)
    addDockTarget({ left: 163, top: 754, width: 64, height: 64 })
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(850))
    act(() => vi.advanceTimersByTime(1000))

    expect(splash(container)).toBeNull()
  })

  it('vanishes in place on a screen with no tab bar', () => {
    matching(STANDALONE)
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(850))
    expect(splash(container)?.dataset.phase).toBe('vanish')

    act(() => vi.advanceTimersByTime(750))
    expect(splash(container)).toBeNull()
  })

  it('treats an invisible target as no target', () => {
    matching(STANDALONE)
    addDockTarget({ width: 0, height: 0 })
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(850))

    expect(splash(container)?.dataset.phase).toBe('vanish')
  })

  it('only fades when the device asks for less motion', () => {
    matching(STANDALONE, REDUCED_MOTION)
    addDockTarget({ left: 163, top: 754, width: 64, height: 64 })
    const { container } = render(<SplashContainer />)

    expect(splash(container)?.dataset.phase).toBe('fade')

    act(() => vi.advanceTimersByTime(220))
    expect(splash(container)).toBeNull()
  })

  it('docks at once when the app hydrates after the bars have risen', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1400)
    matching(STANDALONE)
    addDockTarget({ left: 163, top: 754, width: 64, height: 64 })
    const { container } = render(<SplashContainer />)

    act(() => vi.advanceTimersByTime(0))

    expect(splash(container)?.dataset.phase).toBe('dock')
  })

  it('does not replay when the layout re-renders on navigation', () => {
    matching(STANDALONE)
    const { container, rerender } = render(<SplashContainer />)
    act(() => vi.advanceTimersByTime(850))
    act(() => vi.advanceTimersByTime(750))

    rerender(<SplashContainer />)
    act(() => vi.advanceTimersByTime(2000))

    expect(splash(container)).toBeNull()
  })
})
