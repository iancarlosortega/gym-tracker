/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PULL_THRESHOLD, PullToRefresh, pullDistance } from './pull-to-refresh.tsx'

afterEach(() => {
  cleanup()
  window.scrollY = 0
})

const pull = (element: HTMLElement, from: number, to: number) => {
  fireEvent.touchStart(element, { touches: [{ clientY: from }] })
  fireEvent.touchMove(element, { touches: [{ clientY: to }] })
  fireEvent.touchEnd(element)
}

describe('pullDistance', () => {
  it('resists the finger, so the page follows at half speed and stops at a cap', () => {
    expect(pullDistance(100)).toBe(50)
    expect(pullDistance(-30)).toBe(0)
    expect(pullDistance(1000)).toBeLessThanOrEqual(PULL_THRESHOLD * 1.5)
  })
})

describe('PullToRefresh', () => {
  it('refreshes when pulled past the threshold from the top of the page', async () => {
    const onRefresh = vi.fn(async () => {})
    render(<PullToRefresh onRefresh={onRefresh}>content</PullToRefresh>)

    await act(async () => pull(screen.getByText('content'), 100, 100 + PULL_THRESHOLD * 2 + 20))

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('does nothing for a short pull', async () => {
    const onRefresh = vi.fn(async () => {})
    render(<PullToRefresh onRefresh={onRefresh}>content</PullToRefresh>)

    await act(async () => pull(screen.getByText('content'), 100, 130))

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('leaves an ordinary scroll alone when the page is not at the top', async () => {
    window.scrollY = 300
    const onRefresh = vi.fn(async () => {})
    render(<PullToRefresh onRefresh={onRefresh}>content</PullToRefresh>)

    await act(async () => pull(screen.getByText('content'), 100, 400))

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('says it is refreshing until the refresh is done', async () => {
    let finish = () => {}
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<PullToRefresh onRefresh={onRefresh}>content</PullToRefresh>)

    await act(async () => pull(screen.getByText('content'), 100, 100 + PULL_THRESHOLD * 2 + 20))
    expect(screen.getByRole('status').textContent).toBe('Refreshing')

    await act(async () => finish())
    expect(screen.queryByRole('status')).toBeNull()
  })
})
