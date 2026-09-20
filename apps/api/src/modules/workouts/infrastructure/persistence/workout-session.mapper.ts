import type { workoutSession } from '@api/database/schema/workout-session.table.js'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'

type WorkoutSessionRow = typeof workoutSession.$inferSelect
type WorkoutSessionInsert = typeof workoutSession.$inferInsert

export const workoutSessionMapper = {
  toDomain(row: WorkoutSessionRow): WorkoutSession {
    return WorkoutSession.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      routineId: row.routineId === null ? null : Id.restore(row.routineId),
      startedAt: row.startedAt,
      finishedOn: row.finishedAt,
    })
  },

  toRow(model: WorkoutSession): WorkoutSessionInsert {
    return {
      id: model.id.value,
      userId: model.userId.value,
      routineId: model.routineId?.value ?? null,
      startedAt: model.startedAt,
      finishedAt: model.finishedOn,
    }
  },
}
