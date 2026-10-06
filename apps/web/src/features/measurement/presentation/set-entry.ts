import type { LoadCorrection } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  LoadEntry,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { type DisplayUnit, fromDisplay, gramsToDisplay, spokenUnit, unitLabel } from '@/lib/units'

/** How the weight tile reads for the way an exercise is loaded. */
export const weightTile = (mode: MeasurementMode, perHand: boolean, unit: DisplayUnit) => {
  const reading = { unit: unitLabel(unit), spokenUnit: spokenUnit(unit) }
  switch (mode) {
    case 'PER_SIDE':
      return { label: perHand ? 'Weight per hand' : 'Weight per side', ...reading }
    case 'STACK_POSITION':
      return { label: 'Pin position', unit: undefined, spokenUnit: undefined }
    case 'TOTAL':
      return { label: 'Weight', ...reading }
  }
}

/** Typed in the user's unit; a bar that is not counted stays null, never 0 kg. */
export const entryFor = (
  mode: MeasurementMode,
  value: number,
  barKilograms: number | null,
  unit: DisplayUnit,
): LoadEntry => {
  switch (mode) {
    case 'PER_SIDE':
      return LoadEntry.perSide(
        fromDisplay(value, unit),
        barKilograms === null ? null : fromKilograms(barKilograms),
      )
    case 'STACK_POSITION':
      return LoadEntry.stack(stackPosition(value))
    case 'TOTAL':
      return LoadEntry.total(fromDisplay(value, unit))
  }
}

/** A re-typed load; the set itself knows the bar it was logged with. */
export const correctionFor = (
  mode: MeasurementMode,
  value: number,
  unit: DisplayUnit,
): LoadCorrection =>
  mode === 'STACK_POSITION'
    ? { position: stackPosition(value) }
    : { grams: fromDisplay(value, unit) }

export interface EnteredLoad {
  readonly mode: MeasurementMode
  /** The load as typed: per side for PER_SIDE. Null for a pin. */
  readonly rawGrams: number | null
  readonly position: number | null
}

/** What the weight tile shows when a logged set is opened again: what was typed, not the total. */
export const enteredValue = (set: EnteredLoad, unit: DisplayUnit): string =>
  set.mode === 'STACK_POSITION'
    ? String(set.position ?? '')
    : set.rawGrams === null
      ? ''
      : String(gramsToDisplay(set.rawGrams, unit))
