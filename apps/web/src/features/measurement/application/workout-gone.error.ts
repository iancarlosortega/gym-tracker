/**
 * The workout a queued set belongs to no longer exists on the server.
 *
 * It was deleted, here or on another device. Its sets can never be delivered,
 * so the queue lets them go rather than retrying them forever.
 */
export class WorkoutGoneError extends Error {
  constructor(readonly sessionId: string) {
    super(`Workout ${sessionId} no longer exists.`)
    this.name = 'WorkoutGoneError'
  }
}
