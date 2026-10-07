import { localDate } from '@gym/domain/shared/services/local-calendar'

const DAY_MS = 86_400_000
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
/** Spelled out rather than taken from Intl, whose short months differ between runtimes. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS)

/** Today, yesterday, a weekday within the week, then a short date — all in the phone's days. */
export const lastDoneLabel = (lastDoneAt: string | null, now: Date, timeZone = 'UTC'): string => {
  if (lastDoneAt === null) return 'Never done'

  const done = localDate(new Date(lastDoneAt), timeZone)
  const daysAgo = dayNumber(localDate(now, timeZone)) - dayNumber(done)
  const doneDay = new Date(`${done}T00:00:00Z`)
  if (daysAgo <= 0) return 'Last done today'
  if (daysAgo === 1) return 'Last done yesterday'
  if (daysAgo < 7) return `Last done ${WEEKDAYS[(doneDay.getUTCDay() + 6) % 7]}`
  return `Last done ${doneDay.getUTCDate()} ${MONTHS[doneDay.getUTCMonth()]}`
}
