/**
 * Days and weeks as the person holding the phone lives them.
 *
 * Instants are stored and compared in UTC; only turning one into a calendar
 * day needs a place on Earth. That place is an IANA time zone, and `Intl`
 * knows its offsets and clock changes, so nothing here hard-codes an offset.
 */

const MINUTE_MS = 60_000

/** A calendar date, `YYYY-MM-DD`, with no time of day and no zone. */
export type LocalDate = string

export const isTimeZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

const parts = (instant: Date, zone: string) => {
  const values = new Map<string, number>(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((part): [string, number] => [part.type, Number(part.value)]),
  )
  const get = (type: string) => values.get(type) ?? 0
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** How far the zone's wall clock is ahead of UTC at that instant, in minutes. */
const offsetMinutes = (instant: Date, zone: string): number => {
  const local = parts(instant, zone)
  const asUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  )
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / MINUTE_MS)
}

const pad = (value: number) => String(value).padStart(2, '0')

export const localDate = (instant: Date, zone: string): LocalDate => {
  const { year, month, day } = parts(instant, zone)
  return `${year}-${pad(month)}-${pad(day)}`
}

const utcMidnight = (date: LocalDate): number => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** The instant the zone's clocks read 00:00 on that date. */
export const startOfLocalDay = (date: LocalDate, zone: string): Date => {
  const guess = utcMidnight(date)
  const first = guess - offsetMinutes(new Date(guess), zone) * MINUTE_MS
  // Across a clock change the offset at midnight differs from the one at the guess.
  const settled = guess - offsetMinutes(new Date(first), zone) * MINUTE_MS
  return new Date(settled)
}

/** Calendar arithmetic: the date `days` later (or earlier), whatever the clocks did. */
export const addLocalDays = (date: LocalDate, days: number): LocalDate =>
  new Date(utcMidnight(date) + days * 86_400_000).toISOString().slice(0, 10)

/** Monday is the first day of a lifter's week. */
export const localMonday = (instant: Date, zone: string): LocalDate => {
  const date = localDate(instant, zone)
  const weekday = (new Date(utcMidnight(date)).getUTCDay() + 6) % 7
  return addLocalDays(date, -weekday)
}

/** The instant the local week holding `instant` began: Monday 00:00 in that zone. */
export const startOfLocalWeek = (instant: Date, zone: string): Date =>
  startOfLocalDay(localMonday(instant, zone), zone)
