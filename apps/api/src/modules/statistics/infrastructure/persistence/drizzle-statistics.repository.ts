import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import { setMapper } from '@api/modules/measurement/infrastructure/persistence/set.mapper.js'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, gte, isNull, lte } from 'drizzle-orm'

type LoggedSetRow = typeof loggedSet.$inferSelect

/**
 * The sets a statistic is computed from, scoped to their owner.
 *
 * Ownership lives on the session rather than on the set, so every read joins
 * through it. Reading sets by id alone would let one user's figures include
 * another's work, and a statistic is exactly the place that would never be
 * noticed.
 *
 * No summing happens here. Which sets count towards a mass is a domain rule,
 * and a SQL SUM that quietly included a stack position would be a second
 * implementation of the one rule this product cannot get wrong.
 */
@Injectable()
export class DrizzleStatisticsRepository implements StatisticsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async setsInPeriod(userId: string, period: DateRange): Promise<readonly LoggedSet[]> {
    return await this.read(userId, period)
  }

  async setsForExercise(
    userId: string,
    exerciseId: string,
    period: DateRange,
  ): Promise<readonly LoggedSet[]> {
    return await this.read(userId, period, exerciseId)
  }

  private async read(
    userId: string,
    period: DateRange,
    exerciseId?: string,
  ): Promise<readonly LoggedSet[]> {
    const rows = await this.database
      .select({ set: loggedSet })
      .from(loggedSet)
      .innerJoin(workoutSession, eq(loggedSet.sessionId, workoutSession.id))
      .where(
        and(
          eq(workoutSession.userId, userId),
          isNull(loggedSet.deletedAt),
          gte(loggedSet.loggedAt, period.start),
          lte(loggedSet.loggedAt, period.end),
          exerciseId === undefined ? undefined : eq(loggedSet.exerciseId, exerciseId),
        ),
      )

    return (rows as { set: LoggedSetRow }[]).map((row) => setMapper.toDomain(row.set))
  }
}
