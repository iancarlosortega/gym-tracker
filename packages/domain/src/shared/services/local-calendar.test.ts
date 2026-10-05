import { describe, expect, it } from 'vitest'
import {
  addLocalDays,
  isTimeZone,
  localDate,
  startOfLocalDay,
  startOfLocalWeek,
} from './local-calendar.ts'

const GUAYAQUIL = 'America/Guayaquil'

describe('the local calendar', () => {
  it('puts an evening in Ecuador on its own day, not the UTC one', () => {
    // 20:24 on Sunday 4 October in Guayaquil.
    expect(localDate(new Date('2026-10-05T01:24:20.089Z'), GUAYAQUIL)).toBe('2026-10-04')
  })

  it('starts a local day at local midnight', () => {
    expect(startOfLocalDay('2026-10-04', GUAYAQUIL).toISOString()).toBe('2026-10-04T05:00:00.000Z')
  })

  it('starts the week on the local Monday, so Sunday evening is still last week', () => {
    expect(startOfLocalWeek(new Date('2026-10-05T01:24:20.089Z'), GUAYAQUIL).toISOString()).toBe(
      '2026-09-28T05:00:00.000Z',
    )
  })

  it('starts a Monday at its own midnight', () => {
    expect(startOfLocalWeek(new Date('2026-10-05T05:00:00.000Z'), GUAYAQUIL).toISOString()).toBe(
      '2026-10-05T05:00:00.000Z',
    )
  })

  it('ends a week across a clock change at the next local Monday', () => {
    // Madrid leaves summer time on Sunday 25 October 2026.
    const monday = startOfLocalWeek(new Date('2026-10-21T12:00:00Z'), 'Europe/Madrid')
    const next = startOfLocalDay(
      addLocalDays(localDate(monday, 'Europe/Madrid'), 7),
      'Europe/Madrid',
    )

    expect(monday.toISOString()).toBe('2026-10-18T22:00:00.000Z')
    expect(next.toISOString()).toBe('2026-10-25T23:00:00.000Z')
  })

  it('counts days on the calendar, across month ends', () => {
    expect(addLocalDays('2026-09-28', 7)).toBe('2026-10-05')
    expect(addLocalDays('2026-10-05', -7)).toBe('2026-09-28')
  })

  it('knows a real time zone from a made-up one', () => {
    expect(isTimeZone(GUAYAQUIL)).toBe(true)
    expect(isTimeZone('UTC')).toBe(true)
    expect(isTimeZone('Mars/Olympus')).toBe(false)
  })
})
