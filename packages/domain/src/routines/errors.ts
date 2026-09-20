import { DomainError, type RoutineErrorCode } from '@domain/shared/errors/domain-error.js'

export class InvalidRoutineNameError extends DomainError {
  readonly code: RoutineErrorCode = 'INVALID_ROUTINE_NAME'
}

export class RoutineNotFoundError extends DomainError {
  readonly code: RoutineErrorCode = 'ROUTINE_NOT_FOUND'
}

export class RoutineEntryNotFoundError extends DomainError {
  readonly code: RoutineErrorCode = 'ROUTINE_ENTRY_NOT_FOUND'
}

export class InvalidRestDurationError extends DomainError {
  readonly code: RoutineErrorCode = 'INVALID_REST_DURATION'
}

export class InvalidTargetRepsError extends DomainError {
  readonly code: RoutineErrorCode = 'INVALID_TARGET_REPS'
}

/** Raised when a reorder does not account for exactly the entries a routine has. */
export class InvalidRoutineOrderError extends DomainError {
  readonly code: RoutineErrorCode = 'INVALID_ROUTINE_ORDER'
}
