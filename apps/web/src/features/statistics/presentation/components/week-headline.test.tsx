/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { WeekSummaryResponse } from '../../infrastructure/http-statistics.gateway'
import { WeekHeadline } from './week-headline.tsx'

const week = (overrides: Partial<WeekSummaryResponse> = {}): WeekSummaryResponse => ({
  sets: 17,
  workouts: 3,
  plan: { plannedSets: 18, completedSets: 14 },
  liftsUp: 4,
  liftsHeld: 2,
  liftsDown: 1,
  ...overrides,
})

afterEach(cleanup)

describe('WeekHeadline', () => {
  it('leads with sets, which need no exclusion notice', () => {
    render(<WeekHeadline current={week()} previous={week({ sets: 14 })} />)

    expect(screen.getByText('17')).toBeDefined()
    expect(screen.getByText(/\+3 on last week/)).toBeDefined()
  })

  it('says so in words when nothing moved', () => {
    render(<WeekHeadline current={week()} previous={week()} />)

    expect(screen.getAllByText('same as last').length).toBeGreaterThan(0)
  })

  it('shows a drop as a drop', () => {
    render(<WeekHeadline current={week({ sets: 10 })} previous={week({ sets: 14 })} />)

    expect(screen.getByText(/-4 on last week/)).toBeDefined()
  })

  it('reports plan completion against last week', () => {
    render(
      <WeekHeadline
        current={week()}
        previous={week({ plan: { plannedSets: 18, completedSets: 11 } })}
      />,
    )

    expect(screen.getByText('14/18')).toBeDefined()
    expect(screen.getByText(/was 11\/18/)).toBeDefined()
  })

  it('does not invent a plan for a week of ad hoc work', () => {
    render(<WeekHeadline current={week({ plan: null })} previous={week({ plan: null })} />)

    // Never 0/0: there was nothing to fall short of.
    expect(screen.getByText('no plan followed')).toBeDefined()
    expect(screen.queryByText('0/0')).toBeNull()
  })

  it('reports lifts that went down and held, not only the ones that rose', () => {
    render(<WeekHeadline current={week()} previous={week()} />)

    expect(screen.getByText('lifts up')).toBeDefined()
    expect(screen.getByText('1 down, 2 held')).toBeDefined()
  })
})
