/** One exercise in the plan the open workout follows. */
export interface PlannedExercise {
  readonly exerciseId: string
  readonly targetSets: number | null
}

/**
 * How much of the plan the open workout has done.
 *
 * A planned exercise is done once its logged sets reach its target, or after
 * one set when it has no target. Exercises added outside the plan are not part
 * of it, so they count toward neither number. Sets still waiting to sync count
 * like any other: the lifter did them.
 */
export const sessionProgress = (
  plan: readonly PlannedExercise[],
  sets: readonly { readonly exerciseId: string }[],
): { readonly done: number; readonly planned: number } => {
  const targets = new Map<string, number>()
  for (const { exerciseId, targetSets } of plan) {
    targets.set(exerciseId, Math.max(targets.get(exerciseId) ?? 0, targetSets ?? 1))
  }

  const logged = new Map<string, number>()
  for (const { exerciseId } of sets) {
    logged.set(exerciseId, (logged.get(exerciseId) ?? 0) + 1)
  }

  const done = [...targets].filter(
    ([exerciseId, target]) => (logged.get(exerciseId) ?? 0) >= target,
  )
  return { done: done.length, planned: targets.size }
}
