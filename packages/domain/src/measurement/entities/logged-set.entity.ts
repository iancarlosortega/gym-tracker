import { LoadCorrectionMismatchError, SnapshotMismatchError } from '@domain/measurement/errors.js'
import type { DisplayUnit, Grams } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import {
  isResolved,
  type MassResolution,
} from '@domain/measurement/value-objects/mass-resolution.vo.js'
import type { Reps } from '@domain/measurement/value-objects/reps.vo.js'
import type { StackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'

/**
 * The parameters used to resolve an entry at the moment it was logged.
 *
 * Keeping them on the set is what allows equipment to be corrected later
 * without silently rewriting history: a past set reports what it meant when it
 * was recorded, and recomputation is a deliberate, previewed action.
 */
export interface ResolutionSnapshot {
  readonly barGrams: Grams | null
  readonly displayUnit: DisplayUnit
  readonly equipmentId: string
}

export interface LoggedSetProps {
  /** UUIDv7 generated on the device at log time; also the sync idempotency key. */
  readonly id: string
  readonly sessionId: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly entry: LoadEntry
  readonly reps: Reps
  readonly loggedAt: Date
  readonly snapshot: ResolutionSnapshot
}

/**
 * A re-entered load: grams for a set measured by mass (the per-side value for a
 * PER_SIDE set, as it was typed), or a position for a stack set.
 */
export type LoadCorrection = { readonly grams: Grams } | { readonly position: StackPosition }

export interface SetCorrection {
  readonly load: LoadCorrection
  readonly reps: Reps
}

export interface StoredLoggedSetProps extends LoggedSetProps {
  readonly revision: number
}

/**
 * One set performed during a workout.
 *
 * Identity is the client-generated id, so two instances describing the same
 * set are equal even when their values differ — that is what distinguishes an
 * entity from a value object. State is private and exposed through getters;
 * any change produces a new instance rather than mutating this one.
 */
export class LoggedSet {
  private constructor(
    private readonly props: LoggedSetProps,
    private readonly currentRevision: number,
  ) {
    Object.freeze(this)
  }

  /** Record a set that has just been performed. Starts at revision zero. */
  static create(props: LoggedSetProps): LoggedSet {
    LoggedSet.assertSnapshotMatchesEntry(props)
    return new LoggedSet({ ...props, loggedAt: new Date(props.loggedAt) }, 0)
  }

  /**
   * Rebuild a set that already exists in storage.
   *
   * Distinct from `create` because the stored revision must be preserved
   * rather than restarted: a restored set is not a new event, and treating it
   * as one would reset the counter that orders concurrent corrections.
   */
  static restore(props: StoredLoggedSetProps): LoggedSet {
    LoggedSet.assertSnapshotMatchesEntry(props)
    return new LoggedSet({ ...props, loggedAt: new Date(props.loggedAt) }, props.revision)
  }

  /**
   * A snapshot must agree with the entry it describes: a PER_SIDE entry is
   * resolved against exactly the bar weight it snapshots (or none), and an
   * ordinal entry has no bar at all. Persisting a contradiction here would produce a set
   * whose history could never be recomputed correctly.
   */
  private static assertSnapshotMatchesEntry(props: LoggedSetProps): void {
    const state = props.entry.toJSON()

    if (state.mode === 'PER_SIDE') {
      // Both null is a set that counted no bar; only a disagreement is impossible.
      if (props.snapshot.barGrams !== state.barGrams) {
        throw new SnapshotMismatchError(
          `The snapshot bar weight ${props.snapshot.barGrams} g contradicts the entry's ${state.barGrams} g.`,
        )
      }
      return
    }

    if (state.mode === 'STACK_POSITION' && props.snapshot.barGrams !== null) {
      throw new SnapshotMismatchError(
        'A STACK_POSITION set has no bar, so its snapshot must not carry a bar weight.',
      )
    }
  }

  get id(): string {
    return this.props.id
  }

  get sessionId(): string {
    return this.props.sessionId
  }

  get exerciseId(): string {
    return this.props.exerciseId
  }

  get equipmentId(): string {
    return this.props.equipmentId
  }

  get entry(): LoadEntry {
    return this.props.entry
  }

  get reps(): Reps {
    return this.props.reps
  }

  /** A copy, so a caller cannot mutate the set through the date it receives. */
  get loggedAt(): Date {
    return new Date(this.props.loggedAt)
  }

  get snapshot(): ResolutionSnapshot {
    return this.props.snapshot
  }

  /** Ordering counter for corrections; used by sync to resolve replays. */
  get revision(): number {
    return this.currentRevision
  }

  mass(): MassResolution {
    return this.props.entry.resolveMass()
  }

  /** Only ratio-scale sets may contribute to an aggregate expressed in mass. */
  countsTowardsMassAggregate(): boolean {
    return isResolved(this.mass())
  }

  /** Entities compare by identity, never by value. */
  equals(other: LoggedSet): boolean {
    return this.props.id === other.id
  }

  /** Correct the repetition count, producing a new revision of this set. */
  correctReps(reps: Reps): LoggedSet {
    return new LoggedSet({ ...this.props, reps }, this.currentRevision + 1)
  }

  /**
   * Correct what was entered, producing a new revision of this set.
   *
   * The load is resolved with the snapshot taken when the set was logged, not
   * with the equipment as it is now: a correction fixes a typo, it does not
   * re-measure the set. Mode, equipment, time and snapshot therefore stay.
   */
  correct(correction: SetCorrection): LoggedSet {
    const entry = this.reentered(correction.load)
    return new LoggedSet({ ...this.props, entry, reps: correction.reps }, this.currentRevision + 1)
  }

  private reentered(load: LoadCorrection): LoadEntry {
    const mode = this.props.entry.mode

    if (mode === 'STACK_POSITION') {
      if (!('position' in load)) {
        throw new LoadCorrectionMismatchError(
          'A stack set is corrected with a position, not grams.',
        )
      }
      return LoadEntry.stack(load.position)
    }

    if (!('grams' in load)) {
      throw new LoadCorrectionMismatchError(
        `A ${mode} set is corrected with grams, not a position.`,
      )
    }

    return mode === 'PER_SIDE'
      ? LoadEntry.perSide(load.grams, this.props.snapshot.barGrams)
      : LoadEntry.total(load.grams)
  }

  toJSON(): StoredLoggedSetProps {
    return { ...this.props, revision: this.currentRevision }
  }
}
