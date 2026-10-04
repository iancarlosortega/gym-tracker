export interface RoutineHistory {
  readonly id: string
  /** The user's routine order; it breaks ties. */
  readonly position: number
  readonly archived: boolean
  readonly lastDoneAt: Date | null
}

/**
 * The routine done longest ago comes next.
 *
 * A routine never done ranks before every other, ties follow the user's
 * routine order, and an archived routine is never suggested.
 */
export const upNext = (routines: readonly RoutineHistory[]): string | null => {
  const [next] = routines
    .filter((routine) => !routine.archived)
    .sort((left, right) => lastDone(left) - lastDone(right) || left.position - right.position)

  return next?.id ?? null
}

/** Never done sorts as the oldest instant there is. */
const lastDone = (routine: RoutineHistory): number =>
  routine.lastDoneAt?.getTime() ?? Number.NEGATIVE_INFINITY
