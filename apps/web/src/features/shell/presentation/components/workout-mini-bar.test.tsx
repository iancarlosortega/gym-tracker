/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elapsed, WorkoutMiniBar } from './workout-mini-bar.tsx'

afterEach(cleanup)

describe('elapsed', () => {
  it.each([
    ['2026-10-04T09:00:00Z', '2026-10-04T09:32:10Z', '32:10'],
    ['2026-10-04T09:00:00Z', '2026-10-04T09:00:05Z', '0:05'],
    ['2026-10-04T09:00:00Z', '2026-10-04T10:05:09Z', '1:05:09'],
  ])('reads %s → %s as %s', (startedAt, now, shown) => {
    expect(elapsed(new Date(startedAt), new Date(now))).toBe(shown)
  })

  it('never shows a negative time when the clocks disagree', () => {
    expect(elapsed(new Date('2026-10-04T09:00:10Z'), new Date('2026-10-04T09:00:00Z'))).toBe('0:00')
  })
})

describe('WorkoutMiniBar', () => {
  const props = {
    startedAt: new Date('2026-10-04T09:00:00Z'),
    now: new Date('2026-10-04T09:32:10Z'),
    finishing: false,
  }

  it('says a workout is running and for how long, with a way back to it', () => {
    render(<WorkoutMiniBar {...props} onFinish={vi.fn()} />)

    expect(screen.getByRole('link', { name: /back to the workout/i }).getAttribute('href')).toBe(
      '/workout',
    )
    expect(screen.getByText('32:10')).toBeDefined()
  })

  it('finishes the workout', async () => {
    const onFinish = vi.fn()
    render(<WorkoutMiniBar {...props} onFinish={onFinish} />)

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(onFinish).toHaveBeenCalledOnce()
  })
})
