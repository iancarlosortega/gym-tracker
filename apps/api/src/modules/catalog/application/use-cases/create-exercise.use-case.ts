import { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

export interface CreateExerciseInput {
  readonly userId: string
  readonly name: string
  readonly defaultMode: MeasurementMode
}

export class CreateExerciseUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(input: CreateExerciseInput): Promise<Exercise> {
    const exercise = Exercise.create({
      userId: Id.restore(input.userId),
      name: input.name,
      defaultMode: input.defaultMode,
    })

    // A duplicate name is reused rather than rejected: the user is naming a
    // movement they already track, and a second row would split its history.
    const existing = await this.exercises.findOne(
      Criteria.create<ExerciseCriteriaFields>({
        userId: input.userId,
        name: exercise.name.value,
      }),
    )
    if (existing !== null) {
      return existing.isArchived ? await this.reactivate(existing) : existing
    }

    await this.exercises.save(exercise)
    return exercise
  }

  private async reactivate(exercise: Exercise): Promise<Exercise> {
    const active = exercise.unarchived()
    await this.exercises.save(active)
    return active
  }
}
