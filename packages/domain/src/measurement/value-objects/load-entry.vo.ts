import {
  MissingBarWeightError,
  MissingMeasurementModeError,
  UnknownMeasurementModeError,
} from '../errors.ts'
import { addGrams, doubleGrams, type Grams, grams } from './grams.vo.ts'
import type { MassResolution } from './mass-resolution.vo.ts'
import { type StackPosition, stackPosition } from './stack-position.vo.ts'

/**
 * How a load was measured. The three modes are not interchangeable: TOTAL and
 * PER_SIDE are ratio-scale masses, STACK_POSITION is an ordinal label.
 */
export const MEASUREMENT_MODES = ['TOTAL', 'PER_SIDE', 'STACK_POSITION'] as const

export type MeasurementMode = (typeof MEASUREMENT_MODES)[number]

/**
 * The internal shape of a load entry.
 *
 * It stays private to the class so that `resolveMass` can switch on it with
 * full exhaustiveness checking: adding a fourth mode becomes a compile error
 * rather than a silently unhandled case.
 */
type LoadEntryState =
  | { readonly mode: 'TOTAL'; readonly grams: Grams }
  | { readonly mode: 'PER_SIDE'; readonly perSideGrams: Grams; readonly barGrams: Grams }
  | { readonly mode: 'STACK_POSITION'; readonly position: StackPosition }

function isMeasurementMode(value: unknown): value is MeasurementMode {
  return MEASUREMENT_MODES.includes(value as MeasurementMode)
}

function readNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key]
  return typeof value === 'number' ? value : undefined
}

export class LoadEntry {
  private constructor(private readonly state: LoadEntryState) {}

  static total(value: Grams): LoadEntry {
    return new LoadEntry({ mode: 'TOTAL', grams: value })
  }

  static perSide(perSide: Grams, bar: Grams): LoadEntry {
    return new LoadEntry({ mode: 'PER_SIDE', perSideGrams: perSide, barGrams: bar })
  }

  static stack(position: StackPosition): LoadEntry {
    return new LoadEntry({ mode: 'STACK_POSITION', position })
  }

  /**
   * Build a load entry from untrusted input, rejecting anything that does not
   * declare exactly one of the three supported modes with the fields that mode
   * needs. A PER_SIDE entry without a bar weight cannot be resolved into a
   * mass, so it is refused here rather than resolved into a wrong number later.
   */
  static from(input: unknown): LoadEntry {
    if (typeof input !== 'object' || input === null) {
      throw new MissingMeasurementModeError('A load entry must declare a measurement mode.')
    }

    const source = input as Record<string, unknown>
    const mode = source.mode

    if (mode === undefined || mode === null) {
      throw new MissingMeasurementModeError('A load entry must declare a measurement mode.')
    }
    if (!isMeasurementMode(mode)) {
      throw new UnknownMeasurementModeError(
        `Unknown measurement mode ${String(mode)}. Expected one of ${MEASUREMENT_MODES.join(', ')}.`,
      )
    }

    if (mode === 'TOTAL') {
      return LoadEntry.total(grams(readNumber(source, 'grams') ?? Number.NaN))
    }

    if (mode === 'PER_SIDE') {
      const bar = readNumber(source, 'barGrams')
      if (bar === undefined) {
        throw new MissingBarWeightError(
          'A bar weight is required to resolve a PER_SIDE entry into a total load.',
        )
      }
      return LoadEntry.perSide(grams(readNumber(source, 'perSideGrams') ?? Number.NaN), grams(bar))
    }

    return LoadEntry.stack(stackPosition(readNumber(source, 'position') ?? Number.NaN))
  }

  get mode(): MeasurementMode {
    return this.state.mode
  }

  /** The stack position, when this entry is ordinal; `null` otherwise. */
  get position(): StackPosition | null {
    return this.state.mode === 'STACK_POSITION' ? this.state.position : null
  }

  resolveMass(): MassResolution {
    const state = this.state
    switch (state.mode) {
      case 'TOTAL':
        return { kind: 'resolved', grams: state.grams }
      case 'PER_SIDE':
        return {
          kind: 'resolved',
          grams: addGrams(doubleGrams(state.perSideGrams), state.barGrams),
        }
      case 'STACK_POSITION':
        return {
          kind: 'not-applicable',
          reason:
            'A stack position is an ordinal label, not a mass. It is comparable only against the same exercise.',
        }
    }
  }

  /** The wire and storage shape. Mirrors the columns persisted for a set. */
  toJSON(): LoadEntryState {
    return this.state
  }
}
