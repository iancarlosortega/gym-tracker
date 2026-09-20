import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOpenWorkout } from './find-workout.js'

export interface ResumeWorkoutInput {
  readonly userId: string
}

/**
 * Hand back the workout the user left open.
 *
 * The sets logged into it are not loaded here: they are read through the set
 * repository by session id, so reopening the app costs one row rather than
 * every set of the session.
 */
@Injectable()
export class ResumeWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
  ) {}

  async execute(input: ResumeWorkoutInput): Promise<WorkoutSession> {
    const open = await findOpenWorkout(this.sessions, input.userId)

    if (open === null) {
      throw new WorkoutSessionNotFoundError('You have no workout in progress.')
    }
    return open
  }
}
