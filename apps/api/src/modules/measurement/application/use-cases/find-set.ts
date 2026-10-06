import { findOwnedWorkout } from '@api/modules/workouts/application/use-cases/find-workout.js'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { SetNotFoundError } from '@gym/domain/measurement/errors'
import type {
  SetCriteriaFields,
  SetRepository,
} from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'

/**
 * Load a user's live set or refuse.
 *
 * Sets carry no owner of their own, so ownership is the workout's. A set that
 * is missing, deleted or someone else's reads the same, so the API never
 * confirms that another user's set exists.
 */
export async function findOwnedSet(
  sets: SetRepository,
  sessions: WorkoutSessionRepository,
  userId: string,
  setId: string,
): Promise<LoggedSet> {
  const set = await sets.findOne(Criteria.create<SetCriteriaFields>({ id: setId }))

  if (set === null) {
    throw new SetNotFoundError('That set does not exist.')
  }

  try {
    await findOwnedWorkout(sessions, userId, set.sessionId)
  } catch (error) {
    if (error instanceof WorkoutSessionNotFoundError) {
      throw new SetNotFoundError('That set does not exist.')
    }
    throw error
  }
  return set
}
