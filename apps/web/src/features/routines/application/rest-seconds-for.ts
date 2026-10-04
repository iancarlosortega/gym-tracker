/** Three minutes: the rest for an empty workout or an exercise the routine does not plan. */
export const FALLBACK_REST_SECONDS = 180

interface PlannedRest {
  readonly exerciseId: string
  readonly restSeconds: number
}

/** The rest after a set follows the routine being followed, when there is one. */
export const restSecondsFor =
  (entries: readonly PlannedRest[] | null) =>
  (exerciseId: string): number =>
    entries?.find((entry) => entry.exerciseId === exerciseId)?.restSeconds ?? FALLBACK_REST_SECONDS
