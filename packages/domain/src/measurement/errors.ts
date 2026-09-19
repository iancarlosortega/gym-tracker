import { DomainError, type DomainErrorCode } from '@domain/shared/errors/domain-error.js'

/** Raised when a value cannot be represented as a whole number of grams. */
export class InvalidGramsError extends DomainError {
  readonly code: DomainErrorCode = 'INVALID_GRAMS'
}

/** Raised when a count that must be a positive whole number is not one. */
export class InvalidCountError extends DomainError {
  readonly code: DomainErrorCode = 'INVALID_COUNT'
}

/** Raised when a load entry arrives without a measurement mode. */
export class MissingMeasurementModeError extends DomainError {
  readonly code: DomainErrorCode = 'MISSING_MEASUREMENT_MODE'
}

/** Raised when a load entry declares a mode outside the three supported modes. */
export class UnknownMeasurementModeError extends DomainError {
  readonly code: DomainErrorCode = 'UNKNOWN_MEASUREMENT_MODE'
}

/** Raised when a PER_SIDE entry is built without the bar weight it needs to resolve. */
export class MissingBarWeightError extends DomainError {
  readonly code: DomainErrorCode = 'MISSING_BAR_WEIGHT'
}

/** Raised when ordinal positions from two different exercises are compared. */
export class CrossExerciseComparisonError extends DomainError {
  readonly code: DomainErrorCode = 'CROSS_EXERCISE_COMPARISON'
}

/** Raised when a set's resolution snapshot contradicts the entry it describes. */
export class SnapshotMismatchError extends DomainError {
  readonly code: DomainErrorCode = 'SNAPSHOT_MISMATCH'
}
