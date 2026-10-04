import { CLOCK, WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutFinishedInFutureError } from '@gym/domain/workouts/errors'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedWorkout } from './find-workout.js'

/** How far ahead of the server a phone's clock may run before it is called wrong. */
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000

export interface FinishWorkoutInput {
  readonly userId: string
  readonly sessionId: string
  /**
   * When the user pressed finish. A finish queued offline arrives late, and
   * stamping the arrival would move the end of the workout — and with it the
   * line that decides which late sets still belong to it.
   */
  readonly finishedAt?: Date | undefined
}

@Injectable()
export class FinishWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Finishing is the entity's rule; this supplies the instant and bounds it. */
  async execute(input: FinishWorkoutInput): Promise<WorkoutSession> {
    const session = await findOwnedWorkout(this.sessions, input.userId, input.sessionId)
    const now = this.clock.now()
    const instant = input.finishedAt ?? now

    if (instant.getTime() > now.getTime() + CLOCK_SKEW_TOLERANCE_MS) {
      throw new WorkoutFinishedInFutureError('A workout cannot finish in the future.')
    }

    const finished = session.finishedAt(instant)

    await this.sessions.save(finished)
    return finished
  }
}
