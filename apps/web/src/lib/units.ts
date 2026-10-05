import {
  type DisplayUnit,
  fromKilograms,
  fromPounds,
  type Grams,
  toKilograms,
  toPounds,
} from '@gym/domain/measurement/value-objects/grams.vo'

export type { DisplayUnit }

/** A tenth is as fine as a plate gets; anything finer is rounding noise from grams. */
const toTenth = (value: number): number => Math.round(value * 10) / 10

/** What the user typed, in their unit, as the grams the domain and the API speak. */
export const fromDisplay = (value: number, unit: DisplayUnit): Grams =>
  unit === 'LB' ? fromPounds(value) : fromKilograms(value)

export const gramsToDisplay = (grams: Grams | number, unit: DisplayUnit): number =>
  toTenth(unit === 'LB' ? toPounds(grams as Grams) : toKilograms(grams as Grams))

/** The API answers in kilograms; the screen speaks the user's unit. */
export const kilogramsToDisplay = (kilograms: number, unit: DisplayUnit): number =>
  gramsToDisplay(fromKilograms(kilograms), unit)

export const unitLabel = (unit: DisplayUnit): string => (unit === 'LB' ? 'lb' : 'kg')

export const spokenUnit = (unit: DisplayUnit): string => (unit === 'LB' ? 'pounds' : 'kilograms')
