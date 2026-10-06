/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WorkoutHistoryEntry } from '../../infrastructure/history.api'
import { monthGrid } from '../history-calendar'
import { HistoryCalendar } from './history-calendar.tsx'
import { HistoryList } from './history-list.tsx'
import { HistoryViewToggle } from './history-view-toggle.tsx'
import { ProgressTabs } from './progress-tabs.tsx'

afterEach(cleanup)

const zone = 'America/Guayaquil'

const push: WorkoutHistoryEntry = {
  id: 'w-push',
  routineId: 'r-1',
  routineName: 'Push day',
  startedAt: '2026-10-01T23:10:00.000Z',
  finishedAt: '2026-10-02T00:05:00.000Z',
  setCount: 14,
}

const legs: WorkoutHistoryEntry = {
  id: 'w-legs',
  routineId: null,
  routineName: null,
  startedAt: '2026-10-05T23:05:00.000Z',
  finishedAt: null,
  setCount: 7,
}

describe('ProgressTabs', () => {
  it('links both views and marks the current one', () => {
    render(<ProgressTabs current="history" />)

    expect(screen.getByRole('link', { name: 'Progress' }).getAttribute('href')).toBe('/statistics')
    const history = screen.getByRole('link', { name: 'History' })
    expect(history.getAttribute('href')).toBe('/statistics/history')
    expect(history.getAttribute('aria-current')).toBe('page')
  })
})

describe('HistoryViewToggle', () => {
  it('switches between the list and the calendar', async () => {
    const onChange = vi.fn()
    render(<HistoryViewToggle view="list" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))

    expect(onChange).toHaveBeenCalledWith('calendar')
  })
})

describe('HistoryList', () => {
  it('lists workouts under their week, each linking to its detail', () => {
    render(
      <HistoryList
        weeks={[
          { monday: '2026-10-05', label: 'This week', entries: [legs] },
          { monday: '2026-09-28', label: 'Last week', entries: [push] },
        ]}
        zone={zone}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
      />,
    )

    const thisWeek = screen.getByRole('region', { name: 'This week' })
    const row = within(thisWeek).getByRole('link')
    expect(row.getAttribute('href')).toBe('/statistics/history/w-legs')
    expect(row.textContent).toMatch(/Mon.*5.*No routine.*In progress.*7 sets/)

    const lastWeek = screen.getByRole('region', { name: 'Last week' })
    expect(within(lastWeek).getByRole('link').textContent).toMatch(
      /Thu.*1.*Push day.*14 sets · 55 min/,
    )
  })

  it('offers older workouts while there are more', async () => {
    const onLoadMore = vi.fn()
    render(
      <HistoryList
        weeks={[{ monday: '2026-09-28', label: 'Last week', entries: [push] }]}
        zone={zone}
        hasMore
        loadingMore={false}
        onLoadMore={onLoadMore}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Show older workouts' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('says there are no workouts yet', () => {
    render(
      <HistoryList
        weeks={[]}
        zone={zone}
        hasMore={false}
        loadingMore={false}
        onLoadMore={vi.fn()}
      />,
    )

    expect(screen.getByText('No workouts yet.')).toBeDefined()
  })
})

describe('HistoryCalendar', () => {
  const renderCalendar = (onSelect = vi.fn()) =>
    render(
      <HistoryCalendar
        title="October 2026"
        weeks={monthGrid('2026-10')}
        trained={new Set(['2026-10-01', '2026-10-05'])}
        today="2026-10-06"
        selected="2026-10-01"
        dayEntries={[push]}
        zone={zone}
        onSelect={onSelect}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    )

  it('marks the trained days and the one selected', () => {
    renderCalendar()

    expect(
      screen.getByRole('button', { name: 'October 1, trained' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.getByRole('button', { name: 'October 5, trained' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'October 6, today' })).toBeDefined()
  })

  it('lists the selected day’s workouts', () => {
    renderCalendar()

    expect(screen.getByRole('link', { name: /Push day/ }).getAttribute('href')).toBe(
      '/statistics/history/w-push',
    )
  })

  it('selects a day when it is tapped', async () => {
    const onSelect = vi.fn()
    renderCalendar(onSelect)

    await userEvent.click(screen.getByRole('button', { name: 'October 5, trained' }))
    expect(onSelect).toHaveBeenCalledWith('2026-10-05')
  })
})
