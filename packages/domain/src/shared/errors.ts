import { DomainError, type DomainErrorCode } from '@domain/shared/errors/domain-error.js'

/** Raised when a date range would end before it starts. */
export class InvalidDateRangeError extends DomainError {
  readonly errorCode: DomainErrorCode = 'INVALID_DATE_RANGE'
}

/** Raised when a query limit or offset is not a usable whole number. */
export class InvalidQueryOptionError extends DomainError {
  readonly errorCode: DomainErrorCode = 'INVALID_QUERY_OPTION'
}

/** Raised when a string cannot be a usable identity. */
export class InvalidIdError extends DomainError {
  readonly errorCode: DomainErrorCode = 'INVALID_ID'
}
