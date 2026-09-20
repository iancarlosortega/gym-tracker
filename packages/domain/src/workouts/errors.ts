import { DomainError, type WorkoutErrorCode } from '@domain/shared/errors/domain-error.js'

export class WorkoutSessionNotFoundError extends DomainError {
  readonly code: WorkoutErrorCode = 'WORKOUT_SESSION_NOT_FOUND'
}

/** Raised when a session that has already been finished is finished again. */
export class WorkoutAlreadyFinishedError extends DomainError {
  readonly code: WorkoutErrorCode = 'WORKOUT_ALREADY_FINISHED'
}

/** Raised when a workout is started while another is still open. */
export class WorkoutAlreadyOpenError extends DomainError {
  readonly code: WorkoutErrorCode = 'WORKOUT_ALREADY_OPEN'
}

/** Raised when a session would finish before it started. */
export class InvalidWorkoutTimesError extends DomainError {
  readonly code: WorkoutErrorCode = 'INVALID_WORKOUT_TIMES'
}
