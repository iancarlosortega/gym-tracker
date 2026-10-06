import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import { PUSH_SCHEDULER } from '@api/modules/push/push.tokens.js'
import { findOwnedWorkout } from '@api/modules/workouts/application/use-cases/find-workout.js'
import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type {
  SetCriteriaFields,
  SetRepository,
} from '@gym/domain/measurement/repositories/set.repository'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface DeleteWorkoutInput {
  readonly userId: string
  readonly sessionId: string
}

/** One page is the whole workout: no session comes near the page maximum. */
const WHOLE_WORKOUT = 200

/**
 * Remove a workout and everything logged in it, such as one started by accident.
 *
 * It lives with measurement rather than workouts because it reaches the sets
 * and their rest alerts, the same way logging a set to a workout does. The
 * sets themselves go with the session through the database's cascade.
 */
@Injectable()
export class DeleteWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(SET_REPOSITORY) private readonly sets: SetRepository,
    @Inject(PUSH_SCHEDULER) private readonly scheduler: PushScheduler,
  ) {}

  async execute(input: DeleteWorkoutInput): Promise<void> {
    const session = await findOwnedWorkout(this.sessions, input.userId, input.sessionId)

    const logged = await this.sets.findMany(
      Criteria.create<SetCriteriaFields>({ sessionId: session.id.value }),
      Pagination.create({ limit: WHOLE_WORKOUT }),
    )
    for (const set of logged.items) {
      await this.scheduler.cancelForSet(set.id)
    }

    await this.sessions.delete(session.id.value)
  }
}
