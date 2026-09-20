import type { exercise } from '@api/database/schema/exercise.table.js'
import { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import { ExerciseName } from '@gym/domain/catalog/value-objects/exercise-name.vo'
import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type ExerciseRow = typeof exercise.$inferSelect
type ExerciseInsert = typeof exercise.$inferInsert

export const exerciseMapper = {
  toDomain(row: ExerciseRow): Exercise {
    return Exercise.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      name: ExerciseName.create(row.name),
      defaultMode: row.defaultMode as MeasurementMode,
      archivedOn: row.archivedAt,
      createdAt: row.createdAt,
    })
  },

  toRow(model: Exercise): ExerciseInsert {
    return {
      id: model.id.value,
      userId: model.userId.value,
      name: model.name.value,
      defaultMode: model.defaultMode,
      archivedAt: model.archivedOn,
      createdAt: model.createdAt,
    }
  },
}
