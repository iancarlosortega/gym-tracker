import { DrizzleRepository, type SortColumns } from '@api/common/persistence/drizzle.repository.js'
import { type CriteriaConditions, where } from '@api/common/persistence/drizzle-criteria.js'
import { exercise } from '@api/database/schema/exercise.table.js'
import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
  ExerciseSortField,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { exerciseMapper } from './exercise.mapper.js'

type ExerciseRow = typeof exercise.$inferSelect

export class DrizzleExerciseRepository
  extends DrizzleRepository<Exercise, ExerciseRow, ExerciseCriteriaFields, ExerciseSortField>
  implements ExerciseRepository
{
  protected readonly table = exercise

  /** One entry per declared criteria field; the mapped type enforces that. */
  protected readonly conditions: CriteriaConditions<ExerciseCriteriaFields> = {
    id: where.equals(exercise.id),
    userId: where.equals(exercise.userId),
    // Case-insensitive, matching the value object: one movement, one row.
    name: where.equalsIgnoringCase(exercise.name),
    defaultMode: where.equals(exercise.defaultMode),
    archived: where.markedBy(exercise.archivedAt),
  }

  protected readonly sortColumns: SortColumns<ExerciseSortField> = {
    name: exercise.name,
    createdAt: exercise.createdAt,
  }

  protected toDomain(row: ExerciseRow): Exercise {
    return exerciseMapper.toDomain(row)
  }

  async save(model: Exercise): Promise<void> {
    const row = exerciseMapper.toRow(model)

    await this.database
      .insert(exercise)
      .values(row)
      .onConflictDoUpdate({
        target: exercise.id,
        set: { name: row.name, archivedAt: row.archivedAt ?? null },
      })
  }
}
