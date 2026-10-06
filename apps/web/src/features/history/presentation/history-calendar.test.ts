import { describe, expect, it } from 'vitest'
import type { WorkoutHistoryEntry } from '../infrastructure/history.api'
import {
  addMonths,
  byLocalDay,
  monthBounds,
  monthGrid,
  monthOf,
  monthTitle,
} from './history-calendar.ts'

const zone = 'America/Guayaquil'

describe('a calendar month', () => {
  it('starts at the local first of the month and ends at the next one', () => {
    expect(monthBounds('2026-10', zone)).toEqual({
      from: new Date('2026-10-01T05:00:00Z'),
      to: new Date('2026-11-01T05:00:00Z'),
    })
  })

  it('is the month the phone is in, not the UTC one', () => {
    // 31 October, 22:00 in Guayaquil, already November in UTC.
    expect(monthOf(new Date('2026-11-01T03:00:00Z'), zone)).toBe('2026-10')
  })

  it('moves across years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })

  it('is titled by month and year', () => {
    expect(monthTitle('2026-10')).toBe('October 2026')
  })

  it('lays out whole Monday-first weeks, marking the days outside the month', () => {
    const weeks = monthGrid('2026-10')

    expect(weeks).toHaveLength(5)
    expect(weeks[0]?.map((cell) => cell.date)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ])
    expect(weeks[0]?.[0]?.inMonth).toBe(false)
    expect(weeks[0]?.[3]?.inMonth).toBe(true)
    expect(weeks[4]?.[6]?.date).toBe('2026-11-01')
  })

  it('buckets workouts by their local day', () => {
    const entry = (id: string, startedAt: string): WorkoutHistoryEntry => ({
      id,
      routineId: null,
      routineName: null,
      startedAt,
      finishedAt: null,
      setCount: 0,
    })

    const days = byLocalDay(
      [entry('late', '2026-10-05T01:24:00Z'), entry('morning', '2026-10-04T12:00:00Z')],
      zone,
    )

    expect(days.get('2026-10-04')?.map((workout) => workout.id)).toEqual(['late', 'morning'])
  })
})
