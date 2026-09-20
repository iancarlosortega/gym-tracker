import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import type {
  WorkoutSessionCriteriaFields,
  WorkoutSessionRepository,
} from '@gym/domain/workouts/repositories/workout-session.repository'

/**
 * Load a user's workout or refuse.
 *
 * Scoped by user as well as id, and the same error whether the session is
 * missing or belongs to someone else.
 */
export async function findOwnedWorkout(
  repository: WorkoutSessionRepository,
  userId: string,
  sessionId: string,
): Promise<WorkoutSession> {
  const session = await repository.findOne(
    Criteria.create<WorkoutSessionCriteriaFields>({ id: sessionId, userId }),
  )

  if (session === null) {
    throw new WorkoutSessionNotFoundError('That workout does not exist.')
  }
  return session
}

/** The user's open workout, or null when nothing is in progress. */
export async function findOpenWorkout(
  repository: WorkoutSessionRepository,
  userId: string,
): Promise<WorkoutSession | null> {
  return await repository.findOne(
    Criteria.create<WorkoutSessionCriteriaFields>({ userId, finished: false }),
  )
}
