import type { Routine } from '@domain/routines/entities/routine.entity.js'
import { RoutinesOrderMismatchError } from '@domain/routines/errors.js'
import type { Id } from '@domain/shared/value-objects/id.vo.js'

/**
 * Put the user's routines in the order they named.
 *
 * Every routine is named exactly once or the order is refused: a routine
 * left out would have no place, and guessing one would move it somewhere
 * the user never put it.
 */
export const reorderRoutines = (
  routines: readonly Routine[],
  orderedIds: readonly Id[],
): Routine[] => {
  const unique = new Set(orderedIds.map((id) => id.value))
  const known = new Set(routines.map((routine) => routine.id.value))

  if (
    unique.size !== orderedIds.length ||
    unique.size !== known.size ||
    [...unique].some((id) => !known.has(id))
  ) {
    throw new RoutinesOrderMismatchError('A reorder must name every routine exactly once.')
  }

  return orderedIds.map((id, position) => {
    const routine = routines.find((candidate) => candidate.id.equals(id)) as Routine
    return routine.atPosition(position)
  })
}

/** A new routine goes after every routine there is. */
export const nextRoutinePosition = (routines: readonly Routine[]): number =>
  routines.reduce((last, routine) => Math.max(last, routine.position + 1), 0)
