import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import type { RoutineHistoryRepository } from '@gym/domain/routines/repositories/routine-history.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, isNotNull, max } from 'drizzle-orm'

/** One grouped read over the user's workouts, served by the (user_id, started_at) index. */
@Injectable()
export class DrizzleRoutineHistoryRepository implements RoutineHistoryRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async lastDoneAt(userId: string): Promise<ReadonlyMap<string, Date>> {
    const rows = await this.database
      .select({ routineId: workoutSession.routineId, lastDoneAt: max(workoutSession.startedAt) })
      .from(workoutSession)
      .where(and(eq(workoutSession.userId, userId), isNotNull(workoutSession.routineId)))
      .groupBy(workoutSession.routineId)

    return new Map(
      rows.flatMap((row) =>
        row.routineId === null || row.lastDoneAt === null
          ? []
          : [[row.routineId, new Date(row.lastDoneAt)] as const],
      ),
    )
  }
}
