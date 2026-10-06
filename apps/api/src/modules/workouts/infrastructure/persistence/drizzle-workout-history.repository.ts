import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import { routine } from '@api/database/schema/routine.table.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type {
  StartedWithin,
  WorkoutHistoryEntry,
  WorkoutHistoryRepository,
} from '@gym/domain/workouts/repositories/workout-history.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, count, desc, eq, gte, isNull, lt, type SQL } from 'drizzle-orm'

/**
 * One query per page, served by the (user_id, started_at) index.
 *
 * The id breaks ties so two workouts started in the same instant keep their
 * places from one page to the next.
 */
@Injectable()
export class DrizzleWorkoutHistoryRepository implements WorkoutHistoryRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async page(
    userId: string,
    pagination: Pagination,
    startedWithin: StartedWithin = {},
  ): Promise<Page<WorkoutHistoryEntry>> {
    const owned = ownedWithin(userId, startedWithin)

    const rows = await this.entries(owned)
      .orderBy(desc(workoutSession.startedAt), desc(workoutSession.id))
      .limit(pagination.limit)
      .offset(pagination.offset)

    const [total] = await this.database.select({ value: count() }).from(workoutSession).where(owned)

    return Page.create(rows.map(toEntry), total?.value ?? 0, pagination)
  }

  async entry(userId: string, workoutId: string): Promise<WorkoutHistoryEntry | null> {
    const [row] = await this.entries(
      and(eq(workoutSession.userId, userId), eq(workoutSession.id, workoutId)),
    )
    return row === undefined ? null : toEntry(row)
  }

  /** Each workout with its routine's name and a count of its live sets. */
  private entries(where: SQL | undefined) {
    return this.database
      .select({
        id: workoutSession.id,
        routineId: workoutSession.routineId,
        routineName: routine.name,
        startedAt: workoutSession.startedAt,
        finishedAt: workoutSession.finishedAt,
        setCount: count(loggedSet.id),
      })
      .from(workoutSession)
      .leftJoin(routine, eq(routine.id, workoutSession.routineId))
      .leftJoin(
        loggedSet,
        and(eq(loggedSet.sessionId, workoutSession.id), isNull(loggedSet.deletedAt)),
      )
      .where(where)
      .groupBy(workoutSession.id, routine.name)
      .$dynamic()
  }
}

const toEntry = (row: {
  id: string
  routineId: string | null
  routineName: string | null
  startedAt: Date
  finishedAt: Date | null
  setCount: number
}): WorkoutHistoryEntry => ({
  id: row.id,
  routineId: row.routineId,
  routineName: row.routineName,
  startedAt: new Date(row.startedAt),
  finishedAt: row.finishedAt === null ? null : new Date(row.finishedAt),
  setCount: row.setCount,
})

/** Half-open, so a month's last instant and the next month's first never both count. */
function ownedWithin(userId: string, { from, to }: StartedWithin): SQL | undefined {
  return and(
    eq(workoutSession.userId, userId),
    from === undefined ? undefined : gte(workoutSession.startedAt, from),
    to === undefined ? undefined : lt(workoutSession.startedAt, to),
  )
}
