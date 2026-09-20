import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import { ExerciseNotFoundError } from '@gym/domain/catalog/errors'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

export interface ArchiveExerciseInput {
  readonly userId: string
  readonly exerciseId: string
}

export class ArchiveExerciseUseCase {
  constructor(
    private readonly exercises: ExerciseRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Archiving hides an exercise from routine building and never deletes it.
   * Every set logged against it must keep resolving, so its history stays.
   */
  async execute(input: ArchiveExerciseInput): Promise<Exercise> {
    const exercise = await this.exercises.findOne(
      Criteria.create<ExerciseCriteriaFields>({ id: input.exerciseId, userId: input.userId }),
    )
    if (exercise === null) {
      throw new ExerciseNotFoundError('That exercise does not exist.')
    }

    const archived = exercise.archivedAt(this.clock.now())
    await this.exercises.save(archived)

    return archived
  }
}
