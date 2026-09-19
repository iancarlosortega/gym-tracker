import { SnapshotMismatchError } from '../errors.ts'
import type { DisplayUnit, Grams } from '../value-objects/grams.vo.ts'
import type { LoadEntry } from '../value-objects/load-entry.vo.ts'
import { isResolved, type MassResolution } from '../value-objects/mass-resolution.vo.ts'
import type { Reps } from '../value-objects/reps.vo.ts'

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
   * A snapshot must agree with the entry it describes: a PER_SIDE entry cannot
   * resolve without the bar weight it was logged against, and an ordinal entry
   * has no bar at all. Persisting a contradiction here would produce a set
   * whose history could never be recomputed correctly.
   */
  private static assertSnapshotMatchesEntry(props: LoggedSetProps): void {
    const state = props.entry.toJSON()

    if (state.mode === 'PER_SIDE') {
      if (props.snapshot.barGrams === null) {
        throw new SnapshotMismatchError(
          'A PER_SIDE set must snapshot the bar weight it was logged against.',
        )
      }
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

  toJSON(): StoredLoggedSetProps {
    return { ...this.props, revision: this.currentRevision }
  }
}
