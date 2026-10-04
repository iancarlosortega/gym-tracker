import type { PendingFinish } from '../application/pending-finish.store'
import type { WorkoutSessionResponse } from '../infrastructure/workouts.api'

/**
 * The workout in progress, as far as the phone knows.
 *
 * A finish the user pressed offline closes the workout here at once; the
 * server still calls it open until the finish reaches it, and believing the
 * server would put the finished workout straight back on screen.
 */
export const openWorkout = (
  current: WorkoutSessionResponse | null,
  pendingFinishes: readonly PendingFinish[],
): WorkoutSessionResponse | null =>
  current !== null && !pendingFinishes.some((finish) => finish.sessionId === current.id)
    ? current
    : null
