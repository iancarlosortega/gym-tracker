import { InvalidGramsError } from '@domain/measurement/errors.js'

declare const gramsBrand: unique symbol

/**
 * A mass in whole grams. Grams are the canonical unit for every ratio-scale
 * load in the system; kilograms and pounds exist only at the display edge, so
 * repeated unit switching cannot accumulate floating-point drift.
 */
export type Grams = number & { readonly [gramsBrand]: true }

export type DisplayUnit = 'KG' | 'LB'

const GRAMS_PER_KILOGRAM = 1000

/** The international avoirdupois pound, exact by definition. */
const GRAMS_PER_POUND = 453.59237

export function grams(value: number): Grams {
  if (!Number.isFinite(value)) {
    throw new InvalidGramsError(`A mass must be finite, received ${String(value)}.`)
  }
  if (value < 0) {
    throw new InvalidGramsError(`A mass cannot be negative, received ${value}.`)
  }
  if (!Number.isInteger(value)) {
    throw new InvalidGramsError(`A mass must be a whole number of grams, received ${value}.`)
  }
  return value as Grams
}

export function fromKilograms(kilograms: number): Grams {
  if (!Number.isFinite(kilograms)) {
    throw new InvalidGramsError(`A mass must be finite, received ${String(kilograms)}.`)
  }
  return grams(Math.round(kilograms * GRAMS_PER_KILOGRAM))
}

export function fromPounds(pounds: number): Grams {
  if (!Number.isFinite(pounds)) {
    throw new InvalidGramsError(`A mass must be finite, received ${String(pounds)}.`)
  }
  return grams(Math.round(pounds * GRAMS_PER_POUND))
}

export function toKilograms(value: Grams): number {
  return value / GRAMS_PER_KILOGRAM
}

export function toPounds(value: Grams): number {
  return value / GRAMS_PER_POUND
}

export function addGrams(left: Grams, right: Grams): Grams {
  return grams(left + right)
}

export function doubleGrams(value: Grams): Grams {
  return grams(value * 2)
}
