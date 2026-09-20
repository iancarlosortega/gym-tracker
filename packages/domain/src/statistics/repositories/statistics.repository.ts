import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import type { DateRange } from '@domain/shared/value-objects/date-range.vo.js'

/**
 * The sets a statistic is computed from.
 *
 * Deliberately not an aggregation interface. Every rule about what counts —
 * which modes have a mass, what a week is, which set represents it — lives in
 * the domain services, so the same answers hold whether the sets came from
 * Postgres or from the device's own queue. A repository that returned
 * pre-summed totals would have to know those rules too, and a second
 * implementation of them is a second chance to get RK1 wrong.
 */
export interface StatisticsRepository {
  setsInPeriod(userId: string, period: DateRange): Promise<readonly LoggedSet[]>
  setsForExercise(
    userId: string,
    exerciseId: string,
    period: DateRange,
  ): Promise<readonly LoggedSet[]>
}
