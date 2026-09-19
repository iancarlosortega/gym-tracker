import { InvalidCountError } from '@domain/measurement/errors.js'

declare const repsBrand: unique symbol

/** A repetition count within a single set. */
export type Reps = number & { readonly [repsBrand]: true }

export function reps(value: number): Reps {
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidCountError(
      `A repetition count must be a whole number of 1 or more, received ${value}.`,
    )
  }
  return value as Reps
}
