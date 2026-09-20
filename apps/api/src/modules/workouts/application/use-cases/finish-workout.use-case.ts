import { CLOCK, WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedWorkout } from './find-workout.js'

export interface FinishWorkoutInput {
  readonly userId: string
  readonly sessionId: string
}

@Injectable()
export class FinishWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Finishing is the entity's rule; this only supplies the instant. */
  async execute(input: FinishWorkoutInput): Promise<WorkoutSession> {
    const session = await findOwnedWorkout(this.sessions, input.userId, input.sessionId)
    const finished = session.finishedAt(this.clock.now())

    await this.sessions.save(finished)
    return finished
  }
}
