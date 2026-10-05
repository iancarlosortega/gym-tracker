/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FixedBottom } from './fixed-bottom.tsx'

afterEach(cleanup)

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(84)
})

describe('FixedBottom', () => {
  it('pins its content to the bottom, whatever the viewport claims', () => {
    render(<FixedBottom>tabs</FixedBottom>)

    expect(screen.getByText('tabs').className).toMatch(/fixed/)
    expect(screen.getByText('tabs').className).toMatch(/bottom-0/)
  })

  it('reserves exactly its height, so nothing hides behind it', () => {
    const { container } = render(<FixedBottom>tabs</FixedBottom>)

    const spacer = container.querySelector('[data-slot="fixed-bottom-spacer"]') as HTMLElement
    expect(spacer.style.height).toBe('84px')
  })
})
