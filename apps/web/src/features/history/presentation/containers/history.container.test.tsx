/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HistoryContainer } from './history.container.tsx'

const nav = vi.hoisted(() => ({ view: null as string | null, replaced: [] as string[] }))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(nav.view === null ? '' : `view=${nav.view}`),
  useRouter: () => ({ replace: (href: string) => nav.replaced.push(href) }),
  usePathname: () => '/statistics/history',
}))

const server = vi.hoisted(() => ({ windows: [] as Record<string, unknown>[] }))

vi.mock('../../infrastructure/history.api', () => ({
  getWorkoutHistory: async (window: Record<string, unknown>) => {
    server.windows.push(window)
    return {
      items: [
        {
          id: 'w-push',
          routineId: 'r-1',
          routineName: 'Push day',
          startedAt: '2026-10-01T23:10:00.000Z',
          finishedAt: '2026-10-02T00:05:00.000Z',
          setCount: 14,
        },
      ],
      nextOffset: null,
    }
  },
}))

afterEach(cleanup)

beforeEach(() => {
  nav.view = null
  nav.replaced = []
  server.windows = []
})

const renderHistory = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <HistoryContainer now={new Date('2026-10-06T15:00:00Z')} zone="America/Guayaquil" />
    </QueryClientProvider>,
  )

describe('HistoryContainer', () => {
  it('opens on the list', async () => {
    renderHistory()

    expect(await screen.findByRole('region', { name: 'Last week' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps the chosen view in the address, so going back returns to it', async () => {
    renderHistory()

    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))

    expect(nav.replaced).toEqual(['/statistics/history?view=calendar'])
  })

  it('reads the phone’s month in the calendar, and selects today', async () => {
    nav.view = 'calendar'
    renderHistory()

    expect(await screen.findByRole('button', { name: 'October 1, trained' })).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'October 6, today' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(server.windows[0]).toMatchObject({
      from: new Date('2026-10-01T05:00:00Z'),
      to: new Date('2026-11-01T05:00:00Z'),
    })
  })
})
