import { InvalidCountError } from '../errors.ts'

declare const stackPositionBrand: unique symbol

/**
 * A position on a selectorized weight stack, counted from the top.
 *
 * This is an ORDINAL value, not a mass. Position 7 is heavier than position 6
 * on the same machine, and means nothing at all on a different one: the gap
 * between positions is unknown and is not guaranteed to be uniform.
 */
export type StackPosition = number & { readonly [stackPositionBrand]: true }

export function stackPosition(value: number): StackPosition {
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidCountError(
      `A stack position must be a whole number of 1 or more, received ${value}.`,
    )
  }
  return value as StackPosition
}
