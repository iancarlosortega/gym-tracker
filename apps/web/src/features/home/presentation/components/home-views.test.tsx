/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeHeadline, HomeRoutineList, WeekStrip } from './home-views.tsx'

afterEach(cleanup)

const now = new Date('2026-10-04T10:00:00Z') // a Sunday

describe('HomeHeadline', () => {
  it('names the routine that is up next', () => {
    render(<HomeHeadline upNext={{ name: 'Legs', lastDoneAt: '2026-09-28T08:00:00Z' }} now={now} />)

    expect(screen.getByRole('heading').textContent).toBe('Legs is up next.')
    expect(screen.getByText('Last done Monday')).toBeDefined()
  })

  it('shows the open workout and how much of its plan is done', () => {
    render(
      <HomeHeadline
        upNext={{ name: 'Legs', lastDoneAt: null }}
        open={{ routineName: 'Push day', done: 3, planned: 5 }}
        now={now}
      />,
    )

    const link = screen.getByRole('link', { name: /Push day, 3 of 5 done/ })
    expect(link.getAttribute('href')).toBe('/workout')
  })

  it('names an open workout that follows no routine', () => {
    render(
      <HomeHeadline upNext={null} open={{ routineName: null, done: 0, planned: 0 }} now={now} />,
    )

    expect(screen.getByRole('link', { name: /Workout in progress/ }).getAttribute('href')).toBe(
      '/workout',
    )
  })

  it('offers making the first routine when there is none', () => {
    render(<HomeHeadline upNext={null} now={now} />)

    expect(screen.getByRole('link', { name: 'Make your first routine' }).getAttribute('href')).toBe(
      '/routines',
    )
  })
})

describe('WeekStrip', () => {
  it('marks the days trained this week', () => {
    render(<WeekStrip weekStart="2026-09-28" trainedOn={['2026-09-29', '2026-10-01']} />)

    expect(screen.getByLabelText('Tuesday, trained')).toBeDefined()
    expect(screen.getByLabelText('Thursday, trained')).toBeDefined()
    expect(screen.getByLabelText('Monday, rest day')).toBeDefined()
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })
})

describe('HomeRoutineList', () => {
  const routines = [
    { id: 'r-1', name: 'Push day', lastDoneAt: '2026-10-03T08:00:00Z' },
    { id: 'r-2', name: 'Legs', lastDoneAt: null },
  ]

  it('lists routines with when they were last done and tags the one up next', () => {
    render(
      <HomeRoutineList
        routines={routines}
        upNextId="r-2"
        workoutOpen={false}
        now={now}
        onPick={vi.fn()}
      />,
    )

    const legs = screen.getByRole('button', { name: /legs/i })
    expect(legs.textContent).toMatch(/Up next/)
    expect(legs.textContent).toMatch(/Never done/)
    expect(screen.getByRole('button', { name: /push day/i }).textContent).toMatch(/yesterday/)
  })

  it('opens a routine rather than starting it', async () => {
    const onPick = vi.fn()
    render(
      <HomeRoutineList
        routines={routines}
        upNextId="r-2"
        workoutOpen={false}
        now={now}
        onPick={onPick}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /push day/i }))

    expect(onPick).toHaveBeenCalledWith(routines[0])
  })

  it('cannot start another while a workout is open', () => {
    render(
      <HomeRoutineList routines={routines} upNextId="r-2" workoutOpen now={now} onPick={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /push day/i }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Finish the open one first.')).toBeDefined()
  })
})
