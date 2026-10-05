import { startOfLocalWeek } from '@gym/domain/shared/services/local-calendar'
import { localTimeZone } from '@/lib/local-time'

/** Monday 00:00 on the phone's clock, so a week is the week a lifter thinks in. */
export const startOfWeek = (instant: Date, timeZone = localTimeZone()): Date =>
  startOfLocalWeek(instant, timeZone)
