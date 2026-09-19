/** Raised when a value cannot be represented as a whole number of grams. */
export class InvalidGramsError extends Error {}

/** Raised when a count that must be a positive whole number is not one. */
export class InvalidCountError extends Error {}

/** Raised when a load entry arrives without a measurement mode. */
export class MissingMeasurementModeError extends Error {}

/** Raised when a load entry declares a mode outside the three supported modes. */
export class UnknownMeasurementModeError extends Error {}

/** Raised when a PER_SIDE entry is built without the bar weight it needs to resolve. */
export class MissingBarWeightError extends Error {}

/** Raised when ordinal positions from two different exercises are compared. */
export class CrossExerciseComparisonError extends Error {}

/** Raised when a set's resolution snapshot contradicts the entry it describes. */
export class SnapshotMismatchError extends Error {}
