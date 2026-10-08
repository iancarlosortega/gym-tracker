/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SplashScreen } from './splash-screen.tsx'

afterEach(cleanup)

const splash = (container: HTMLElement) => container.querySelector('.splash') as HTMLElement

describe('SplashScreen', () => {
  it('is decoration only, hidden from assistive technology', () => {
    const { container } = render(<SplashScreen phase={null} />)

    expect(splash(container).getAttribute('aria-hidden')).toBe('true')
  })

  it('draws the icon: a week of seven bars and the dumbbell', () => {
    const { container } = render(<SplashScreen phase={null} />)

    expect(container.querySelectorAll('.splash-bar')).toHaveLength(7)
    expect(container.querySelector('.splash-lift')).not.toBeNull()
  })

  it('carries no phase until the app takes it over, so the CSS cap can clear it', () => {
    const { container } = render(<SplashScreen phase={null} />)

    expect(splash(container).hasAttribute('data-phase')).toBe(false)
  })

  it('docks toward the given point and size', () => {
    const { container } = render(
      <SplashScreen phase="dock" dock={{ x: 195, y: 786, scale: 0.5 }} />,
    )
    const root = splash(container)

    expect(root.dataset.phase).toBe('dock')
    expect(root.style.getPropertyValue('--dock-x')).toBe('195px')
    expect(root.style.getPropertyValue('--dock-y')).toBe('786px')
    expect(root.style.getPropertyValue('--dock-scale')).toBe('0.5')
  })
})
