import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import { findOwnedWorkout } from '@api/modules/workouts/application/use-cases/find-workout.js'
import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type {
  SetCriteriaFields,
  SetRepository,
  SetSortField,
} from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface ListSessionSetsInput {
  readonly userId: string
  readonly sessionId: string
}

/** One page is the whole workout: no session comes near the page maximum. */
const WHOLE_WORKOUT = 200

/**
 * What a workout has logged so far, so the screen can rebuild its list after
 * the phone dropped it. Ownership first: another user's workout reads as missing.
 */
@Injectable()
export class ListSessionSetsUseCase {
  constructor(
    @Inject(SET_REPOSITORY) private readonly sets: SetRepository,
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
  ) {}

  async execute(input: ListSessionSetsInput): Promise<readonly LoggedSet[]> {
    await findOwnedWorkout(this.sessions, input.userId, input.sessionId)

    const page = await this.sets.findMany(
      Criteria.create<SetCriteriaFields>({ sessionId: input.sessionId }),
      Pagination.create({ limit: WHOLE_WORKOUT }),
      QueryOptions.none<SetSortField>().orderedBy('loggedAt'),
    )
    return page.items
  }
}
