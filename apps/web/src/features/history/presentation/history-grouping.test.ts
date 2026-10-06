import { describe, expect, it } from 'vitest'
import type { WorkoutHistoryEntry } from '../infrastructure/history.api'
import {
  durationLabel,
  groupByWeek,
  weekdayAndDay,
  workoutDay,
  workoutTimes,
} from './history-grouping.ts'

const zone = 'America/Guayaquil'

const workout = (id: string, startedAt: string, finishedAt: string | null = null) =>
  ({
    id,
    routineId: null,
    routineName: null,
    startedAt,
    finishedAt,
    setCount: 0,
  }) satisfies WorkoutHistoryEntry

// Tuesday 6 October 2026, 10:00 in Guayaquil.
const now = new Date('2026-10-06T15:00:00Z')

describe('grouping history by week', () => {
  it('names this week and last week, then the dates of older weeks', () => {
    const groups = groupByWeek(
      [
        workout('legs', '2026-10-05T23:05:00Z'),
        workout('push', '2026-10-01T23:10:00Z'),
        workout('pull', '2026-09-29T23:00:00Z'),
        workout('old', '2026-09-24T23:00:00Z'),
      ],
      now,
      zone,
    )

    expect(groups.map((group) => [group.label, group.entries.map((entry) => entry.id)])).toEqual([
      ['This week', ['legs']],
      ['Last week', ['push', 'pull']],
      ['Sep 21 – 27', ['old']],
    ])
  })

  it('puts a Sunday-evening workout in its local week, not the next UTC one', () => {
    // Sunday 4 October, 20:24 in Guayaquil, already Monday in UTC.
    const groups = groupByWeek([workout('late', '2026-10-05T01:24:00Z')], now, zone)

    expect(groups[0]?.label).toBe('Last week')
  })

  it('names a week that spans two months by both', () => {
    const groups = groupByWeek([workout('w', '2026-09-01T12:00:00Z')], now, zone)

    expect(groups[0]?.label).toBe('Aug 31 – Sep 6')
  })
})

describe('labels for one workout', () => {
  it('reads the local weekday and day of the month', () => {
    expect(weekdayAndDay('2026-10-05T01:24:00Z', zone)).toEqual({ weekday: 'Sun', day: 4 })
  })

  it('reads minutes under an hour, and hours with minutes above', () => {
    expect(durationLabel('2026-10-01T23:10:00Z', '2026-10-02T00:05:00Z')).toBe('55 min')
    expect(durationLabel('2026-09-29T23:00:00Z', '2026-09-30T00:02:00Z')).toBe('1 h 02')
  })

  it('has no duration while the workout is open', () => {
    expect(durationLabel('2026-10-05T23:05:00Z', null)).toBeNull()
  })
})

describe('the header of one workout', () => {
  it('names the local day', () => {
    expect(workoutDay('2026-10-05T01:24:00Z', zone)).toBe('Sun, Oct 4')
  })

  it('reads the local start and finish on a 24-hour clock', () => {
    expect(workoutTimes('2026-10-01T23:10:00Z', '2026-10-02T00:05:00Z', zone)).toBe('18:10 – 19:05')
  })

  it('reads only the start while the workout is open', () => {
    expect(workoutTimes('2026-10-05T23:05:00Z', null, zone)).toBe('from 18:05')
  })
})
