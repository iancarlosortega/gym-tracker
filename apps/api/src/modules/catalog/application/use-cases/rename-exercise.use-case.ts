import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import { ExerciseNotFoundError } from '@gym/domain/catalog/errors'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

export interface RenameExerciseInput {
  readonly userId: string
  readonly exerciseId: string
  readonly name: string
}

export class RenameExerciseUseCase {
  constructor(private readonly exercises: ExerciseRepository) {}

  async execute(input: RenameExerciseInput): Promise<Exercise> {
    const exercise = await this.exercises.findOne(
      // Scoped by user as well as id, so an identifier alone never reaches
      // another account's data.
      Criteria.create<ExerciseCriteriaFields>({ id: input.exerciseId, userId: input.userId }),
    )
    if (exercise === null) {
      throw new ExerciseNotFoundError('That exercise does not exist.')
    }

    const renamed = exercise.renamedTo(input.name)
    await this.exercises.save(renamed)

    return renamed
  }
}
