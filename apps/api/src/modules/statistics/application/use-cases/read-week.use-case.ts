import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import {
  addLocalDays,
  localDate,
  localMonday,
  startOfLocalDay,
} from '@gym/domain/shared/services/local-calendar'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { type WeekSummary, weekSummary } from '@gym/domain/statistics/services/week-summary.service'
import { Inject, Injectable } from '@nestjs/common'

export interface ReadWeekInput {
  readonly userId: string
  /** Any instant in the week asked for; the phone sends its local Monday at midnight. */
  readonly weekStart: Date
  /** The phone's IANA zone: days and weeks are cut where its clocks turn over. */
  readonly timeZone?: string | undefined
}

export interface WeekComparison {
  readonly current: WeekSummary
  readonly previous: WeekSummary
  /** The days of this week with a workout, as ISO dates, each once and in order. */
  readonly trainedOn: readonly string[]
}

/**
 * This week, and the week before it to read it against.
 *
 * Both are computed rather than one being stored: a set logged late, or
 * corrected, changes the week it belonged to the moment it lands, and a
 * cached summary would keep insisting otherwise.
 */
@Injectable()
export class ReadWeekUseCase {
  constructor(@Inject(STATISTICS_REPOSITORY) private readonly statistics: StatisticsRepository) {}

  async execute(input: ReadWeekInput): Promise<WeekComparison> {
    const zone = input.timeZone ?? 'UTC'
    const monday = localMonday(input.weekStart, zone)
    const current = weekFrom(monday, zone)
    const previous = weekFrom(addLocalDays(monday, -7), zone)

    const [currentSets, previousSets, earlierSets, sessions, previousSessions] = await Promise.all([
      this.statistics.setsInPeriod(input.userId, current),
      this.statistics.setsInPeriod(input.userId, previous),
      this.statistics.setsInPeriod(input.userId, weekFrom(addLocalDays(monday, -14), zone)),
      this.statistics.sessionsInPeriod(input.userId, current),
      this.statistics.sessionsInPeriod(input.userId, previous),
    ])

    const plans = await this.statistics.plannedSetsByRoutine(
      routineIdsOf([...sessions, ...previousSessions]),
    )

    return {
      current: weekSummary({
        sets: currentSets,
        sessions,
        plannedSetsByRoutine: plans,
        previousSets,
        timeZone: zone,
      }),
      previous: weekSummary({
        sets: previousSets,
        sessions: previousSessions,
        plannedSetsByRoutine: plans,
        previousSets: earlierSets,
        timeZone: zone,
      }),
      trainedOn: daysOf(sessions, zone),
    }
  }
}

const daysOf = (sessions: readonly { readonly startedAt: Date }[], zone: string): string[] =>
  [...new Set(sessions.map((session) => localDate(session.startedAt, zone)))].sort()

/**
 * Local Monday 00:00 to the last instant before the next one. Counted in
 * calendar days, so a week holding a clock change is 167 or 169 hours long.
 */
const weekFrom = (monday: string, zone: string): DateRange =>
  DateRange.between(
    startOfLocalDay(monday, zone),
    new Date(startOfLocalDay(addLocalDays(monday, 7), zone).getTime() - 1),
  )

const routineIdsOf = (
  sessions: readonly { readonly routineId: { readonly value: string } | null }[],
): string[] => [
  ...new Set(
    sessions
      .map((session) => session.routineId?.value)
      .filter((routineId): routineId is string => routineId !== undefined),
  ),
]
