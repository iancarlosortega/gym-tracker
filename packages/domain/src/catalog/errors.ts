import { type CatalogErrorCode, DomainError } from '@domain/shared/errors/domain-error.js'

/** Raised when an exercise name is empty or unusably long. */
export class InvalidExerciseNameError extends DomainError {
  readonly code: CatalogErrorCode = 'INVALID_EXERCISE_NAME'
}

/** Raised when an exercise is referenced and does not exist. */
export class ExerciseNotFoundError extends DomainError {
  readonly code: CatalogErrorCode = 'EXERCISE_NOT_FOUND'
}
