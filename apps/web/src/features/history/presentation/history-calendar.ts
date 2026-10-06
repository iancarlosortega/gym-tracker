import {
  addLocalDays,
  type LocalDate,
  localDate,
  localMonday,
  startOfLocalDay,
} from '@gym/domain/shared/services/local-calendar'
import type { WorkoutHistoryEntry } from '../infrastructure/history.api'

/** A calendar month as "2026-10". */
export type Month = string

export interface CalendarCell {
  readonly date: LocalDate
  /** False for the days of the months before and after that fill the first and last week. */
  readonly inMonth: boolean
}

const firstDay = (month: Month): LocalDate => `${month}-01`

export const monthOf = (instant: Date, zone: string): Month => localDate(instant, zone).slice(0, 7)

export const addMonths = (month: Month, months: number): Month => {
  const [year = 0, index = 1] = month.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, index - 1 + months, 1))
  return shifted.toISOString().slice(0, 7)
}

/** From the local first of the month to the local first of the next: what the API is asked for. */
export const monthBounds = (month: Month, zone: string) => ({
  from: startOfLocalDay(firstDay(month), zone),
  to: startOfLocalDay(firstDay(addMonths(month, 1)), zone),
})

export const monthTitle = (month: Month): string =>
  new Date(`${firstDay(month)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

/** Whole Monday-first weeks covering the month, as a lifter's week is counted. */
export const monthGrid = (month: Month): CalendarCell[][] => {
  const last = addLocalDays(firstDay(addMonths(month, 1)), -1)
  const weeks: CalendarCell[][] = []

  // Noon UTC is the same calendar date in any zone, so localMonday reads the grid's date as is.
  for (
    let monday = localMonday(new Date(`${firstDay(month)}T12:00:00Z`), 'UTC');
    monday <= last;
    monday = addLocalDays(monday, 7)
  ) {
    weeks.push(
      Array.from({ length: 7 }, (_, offset) => {
        const date = addLocalDays(monday, offset)
        return { date, inMonth: date.startsWith(month) }
      }),
    )
  }
  return weeks
}

/** Workouts by the local day they started on, keeping their order. */
export const byLocalDay = (
  entries: readonly WorkoutHistoryEntry[],
  zone: string,
): Map<LocalDate, WorkoutHistoryEntry[]> => {
  const days = new Map<LocalDate, WorkoutHistoryEntry[]>()
  for (const entry of entries) {
    const date = localDate(new Date(entry.startedAt), zone)
    days.set(date, [...(days.get(date) ?? []), entry])
  }
  return days
}
