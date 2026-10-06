import { WORKOUT_HISTORY_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import type {
  WorkoutHistoryEntry,
  WorkoutHistoryRepository,
} from '@gym/domain/workouts/repositories/workout-history.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface GetWorkoutInput {
  readonly userId: string
  readonly workoutId: string
}

/** One past workout as history shows it, for a detail page opened directly. */
@Injectable()
export class GetWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_HISTORY_REPOSITORY) private readonly history: WorkoutHistoryRepository,
  ) {}

  async execute(input: GetWorkoutInput): Promise<WorkoutHistoryEntry> {
    const entry = await this.history.entry(input.userId, input.workoutId)

    if (entry === null) {
      throw new WorkoutSessionNotFoundError('That workout does not exist.')
    }
    return entry
  }
}
