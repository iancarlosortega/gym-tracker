import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { type WeekSummary, weekSummary } from '@gym/domain/statistics/services/week-summary.service'
import { Inject, Injectable } from '@nestjs/common'

export interface ReadWeekInput {
  readonly userId: string
  /** The Monday the week starts on. */
  readonly weekStart: Date
}

const WEEK_MILLISECONDS = 7 * 24 * 60 * 60 * 1000

export interface WeekComparison {
  readonly current: WeekSummary
  readonly previous: WeekSummary
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
    const current = weekFrom(input.weekStart)
    const previous = weekFrom(new Date(input.weekStart.getTime() - WEEK_MILLISECONDS))

    const [currentSets, previousSets, earlierSets, sessions, previousSessions] = await Promise.all([
      this.statistics.setsInPeriod(input.userId, current),
      this.statistics.setsInPeriod(input.userId, previous),
      this.statistics.setsInPeriod(
        input.userId,
        weekFrom(new Date(previous.start.getTime() - WEEK_MILLISECONDS)),
      ),
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
      }),
      previous: weekSummary({
        sets: previousSets,
        sessions: previousSessions,
        plannedSetsByRoutine: plans,
        previousSets: earlierSets,
      }),
    }
  }
}

/** Monday to the last instant of Sunday. */
const weekFrom = (start: Date): DateRange =>
  DateRange.between(start, new Date(start.getTime() + WEEK_MILLISECONDS - 1))

const routineIdsOf = (
  sessions: readonly { readonly routineId: { readonly value: string } | null }[],
): string[] => [
  ...new Set(
    sessions
      .map((session) => session.routineId?.value)
      .filter((routineId): routineId is string => routineId !== undefined),
  ),
]
