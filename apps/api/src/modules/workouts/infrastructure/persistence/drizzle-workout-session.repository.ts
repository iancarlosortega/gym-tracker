import {
  type Database,
  DrizzleRepository,
  type SortColumns,
} from '@api/common/persistence/drizzle.repository.js'
import { type CriteriaConditions, where } from '@api/common/persistence/drizzle-criteria.js'
import { DATABASE } from '@api/database/database.module.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import type {
  WorkoutSessionCriteriaFields,
  WorkoutSessionRepository,
  WorkoutSessionSortField,
} from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { workoutSessionMapper } from './workout-session.mapper.js'

type WorkoutSessionRow = typeof workoutSession.$inferSelect

/**
 * A session is one flat row, so the base class covers every read.
 *
 * Only the fields a session can still change are updated on conflict: the
 * start and the routine are settled the moment it began.
 */
@Injectable()
export class DrizzleWorkoutSessionRepository
  extends DrizzleRepository<
    WorkoutSession,
    WorkoutSessionRow,
    WorkoutSessionCriteriaFields,
    WorkoutSessionSortField
  >
  implements WorkoutSessionRepository
{
  constructor(@Inject(DATABASE) database: Database) {
    super(database)
  }

  protected readonly table = workoutSession

  protected readonly conditions: CriteriaConditions<WorkoutSessionCriteriaFields> = {
    id: where.equals(workoutSession.id),
    userId: where.equals(workoutSession.userId),
    routineId: where.equals(workoutSession.routineId),
    finished: where.markedBy(workoutSession.finishedAt),
  }

  protected readonly sortColumns: SortColumns<WorkoutSessionSortField> = {
    startedAt: workoutSession.startedAt,
  }

  protected toDomain(row: WorkoutSessionRow): WorkoutSession {
    return workoutSessionMapper.toDomain(row)
  }

  async save(model: WorkoutSession): Promise<void> {
    const row = workoutSessionMapper.toRow(model)

    await this.database
      .insert(workoutSession)
      .values(row)
      .onConflictDoUpdate({
        target: workoutSession.id,
        set: { finishedAt: row.finishedAt ?? null },
      })
  }

  /** Its sets go with it through the foreign key's cascade. */
  async delete(id: string): Promise<void> {
    await this.database.delete(workoutSession).where(eq(workoutSession.id, id))
  }
}
