/**
 * The base every domain error extends.
 *
 * The `code` is what the presentation layer maps to an HTTP status. Mapping on
 * a code rather than on `instanceof` keeps the domain free of transport
 * concerns and stops the mapping from becoming a chain that has to be extended
 * every time an error is added.
 *
 * Codes are grouped per feature so the HTTP mapping can be split the same way,
 * living beside the module it describes rather than in one growing table.
 */
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export const SHARED_ERROR_CODES = [
  'INVALID_ID',
  'INVALID_DATE_RANGE',
  'INVALID_QUERY_OPTION',
] as const

export const AUTH_ERROR_CODES = [
  'AUTHENTICATION_FAILED',
  'SESSION_EXPIRED',
  'ACCOUNT_ALREADY_EXISTS',
  'INVALID_EMAIL',
  'INVALID_CREDENTIAL',
] as const

export const MEASUREMENT_ERROR_CODES = [
  'INVALID_GRAMS',
  'INVALID_COUNT',
  'MISSING_MEASUREMENT_MODE',
  'UNKNOWN_MEASUREMENT_MODE',
  'MISSING_BAR_WEIGHT',
  'CROSS_EXERCISE_COMPARISON',
  'SNAPSHOT_MISMATCH',
] as const

export type SharedErrorCode = (typeof SHARED_ERROR_CODES)[number]
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]
export type MeasurementErrorCode = (typeof MEASUREMENT_ERROR_CODES)[number]

export type DomainErrorCode = SharedErrorCode | AuthErrorCode | MeasurementErrorCode
