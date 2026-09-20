import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import { RoutineNotFoundError } from '@gym/domain/routines/errors'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
} from '@gym/domain/routines/repositories/routine.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

/**
 * Load a user's routine or refuse.
 *
 * Scoped by user as well as id, and the same error whether the routine is
 * missing or belongs to someone else.
 */
export async function findOwnedRoutine(
  repository: RoutineRepository,
  userId: string,
  routineId: string,
): Promise<Routine> {
  const routine = await repository.findOne(
    Criteria.create<RoutineCriteriaFields>({ id: routineId, userId }),
  )

  if (routine === null) {
    throw new RoutineNotFoundError('That routine does not exist.')
  }
  return routine
}
