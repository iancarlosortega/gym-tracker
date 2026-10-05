import { DomainError, type RoutineErrorCode } from '@domain/shared/errors/domain-error.js'

export class InvalidRoutineNameError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'INVALID_ROUTINE_NAME'
}

export class RoutineNotFoundError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'ROUTINE_NOT_FOUND'
}

export class RoutineEntryNotFoundError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'ROUTINE_ENTRY_NOT_FOUND'
}

export class InvalidRestDurationError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'INVALID_REST_DURATION'
}

export class InvalidTargetRepsError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'INVALID_TARGET_REPS'
}

/** Raised when a reorder does not account for exactly the entries a routine has. */
export class InvalidRoutineOrderError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'INVALID_ROUTINE_ORDER'
}

/**
 * Raised when an order for the user's routines does not name exactly their
 * active routines: usually the list changed on another device in between.
 */
export class RoutinesOrderMismatchError extends DomainError {
  readonly errorCode: RoutineErrorCode = 'ROUTINES_ORDER_MISMATCH'
}
