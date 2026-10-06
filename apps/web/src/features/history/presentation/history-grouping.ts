import {
  addLocalDays,
  type LocalDate,
  localDate,
  localMonday,
} from '@gym/domain/shared/services/local-calendar'
import type { WorkoutHistoryEntry } from '../infrastructure/history.api'

export interface HistoryWeek {
  /** The local Monday the week starts on. */
  readonly monday: LocalDate
  readonly label: string
  readonly entries: readonly WorkoutHistoryEntry[]
}

/** A LocalDate read at UTC midnight, so formatting never shifts it a day. */
const asUtc = (date: LocalDate) => new Date(`${date}T00:00:00Z`)

const monthShort = (date: LocalDate) =>
  asUtc(date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })

const dayOf = (date: LocalDate) => Number(date.slice(8, 10))

const weekLabel = (monday: LocalDate, thisMonday: LocalDate): string => {
  if (monday === thisMonday) return 'This week'
  if (monday === addLocalDays(thisMonday, -7)) return 'Last week'

  const sunday = addLocalDays(monday, 6)
  return monthShort(monday) === monthShort(sunday)
    ? `${monthShort(monday)} ${dayOf(monday)} – ${dayOf(sunday)}`
    : `${monthShort(monday)} ${dayOf(monday)} – ${monthShort(sunday)} ${dayOf(sunday)}`
}

/**
 * History under week headings, in the phone's zone: a Sunday-evening workout
 * belongs to that Sunday's week even when UTC has already moved on.
 * Entries arrive newest first and keep that order.
 */
export const groupByWeek = (
  entries: readonly WorkoutHistoryEntry[],
  now: Date,
  zone: string,
): HistoryWeek[] => {
  const thisMonday = localMonday(now, zone)
  const weeks: { monday: LocalDate; entries: WorkoutHistoryEntry[] }[] = []

  for (const entry of entries) {
    const monday = localMonday(new Date(entry.startedAt), zone)
    const last = weeks.at(-1)
    if (last?.monday === monday) {
      last.entries.push(entry)
    } else {
      weeks.push({ monday, entries: [entry] })
    }
  }

  return weeks.map((week) => ({ ...week, label: weekLabel(week.monday, thisMonday) }))
}

/** "Sun" and 4: the day a workout falls on where the phone is. */
export const weekdayAndDay = (startedAt: string, zone: string) => {
  const date = localDate(new Date(startedAt), zone)
  return {
    weekday: asUtc(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    day: dayOf(date),
  }
}

/** "55 min" or "1 h 02"; null while the workout is still open. */
export const durationLabel = (startedAt: string, finishedAt: string | null): string | null => {
  if (finishedAt === null) return null

  const minutes = Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 60_000)
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
