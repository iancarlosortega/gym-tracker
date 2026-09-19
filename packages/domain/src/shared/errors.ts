/** Raised when a date range would end before it starts. */
export class InvalidDateRangeError extends Error {}

/** Raised when a query limit or offset is not a usable whole number. */
export class InvalidQueryOptionError extends Error {}
