import { type CatalogErrorCode, DomainError } from '@domain/shared/errors/domain-error.js'

/** Raised when an exercise name is empty or unusably long. */
export class InvalidExerciseNameError extends DomainError {
  readonly code: CatalogErrorCode = 'INVALID_EXERCISE_NAME'
}

/** Raised when an exercise is referenced and does not exist. */
export class ExerciseNotFoundError extends DomainError {
  readonly code: CatalogErrorCode = 'EXERCISE_NOT_FOUND'
}

/** Raised when an equipment name is empty or unusably long. */
export class InvalidEquipmentNameError extends DomainError {
  readonly code: CatalogErrorCode = 'INVALID_EQUIPMENT_NAME'
}

/** Raised when equipment is referenced and does not exist. */
export class EquipmentNotFoundError extends DomainError {
  readonly code: CatalogErrorCode = 'EQUIPMENT_NOT_FOUND'
}

/** Raised when equipment cannot express the measurement mode being asked of it. */
export class EquipmentCannotMeasureThatWayError extends DomainError {
  readonly code: CatalogErrorCode = 'EQUIPMENT_CANNOT_MEASURE_THAT_WAY'
}

/** Raised when a stack position exceeds the positions the machine has. */
export class StackPositionOutOfRangeError extends DomainError {
  readonly code: CatalogErrorCode = 'STACK_POSITION_OUT_OF_RANGE'
}
