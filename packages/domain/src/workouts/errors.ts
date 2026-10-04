import { DomainError, type WorkoutErrorCode } from '@domain/shared/errors/domain-error.js'

export class WorkoutSessionNotFoundError extends DomainError {
  readonly errorCode: WorkoutErrorCode = 'WORKOUT_SESSION_NOT_FOUND'
}

/** Raised when a session that has already been finished is finished again. */
export class WorkoutAlreadyFinishedError extends DomainError {
  readonly errorCode: WorkoutErrorCode = 'WORKOUT_ALREADY_FINISHED'
}

/** Raised when a workout is started while another is still open. */
export class WorkoutAlreadyOpenError extends DomainError {
  readonly errorCode: WorkoutErrorCode = 'WORKOUT_ALREADY_OPEN'
}

/** Raised when a session would finish before it started. */
export class InvalidWorkoutTimesError extends DomainError {
  readonly errorCode: WorkoutErrorCode = 'INVALID_WORKOUT_TIMES'
}

/**
 * Raised when a finish names an instant further ahead than any phone clock
 * plausibly runs. The finish is the device's instant, so a few minutes of skew
 * is expected; more than that is a wrong clock, not a late delivery.
 */
export class WorkoutFinishedInFutureError extends DomainError {
  readonly errorCode: WorkoutErrorCode = 'WORKOUT_FINISHED_IN_FUTURE'
}
