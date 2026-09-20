import {
  type AddEntryInput,
  type ChangeEntryInput,
  RoutineEntry,
} from '@domain/routines/entities/routine-entry.entity.js'
import { InvalidRoutineOrderError, RoutineEntryNotFoundError } from '@domain/routines/errors.js'
import { RoutineName } from '@domain/routines/value-objects/routine-name.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export interface CreateRoutineInput {
  readonly userId: Id
  readonly name: string
  readonly createdAt?: Date | undefined
}

export interface RoutineProps {
  readonly id: Id
  readonly userId: Id
  readonly name: RoutineName
  readonly entries: readonly RoutineEntry[]
  readonly archivedOn: Date | null
  readonly createdAt: Date
}

/**
 * A reusable plan: an ordered list of exercises with their targets.
 *
 * The aggregate root owns its entries. Positions are always contiguous from
 * one, maintained here rather than trusted from a caller, because a routine
 * with a gap or a duplicate position has no defined order to present at the
 * gym — and that is the one moment it has to be right.
 *
 * Every change returns a new routine. A completed session refers to the
 * routine by identity, so editing a plan never rewrites what was done.
 */
export class Routine {
  private constructor(private readonly props: RoutineProps) {
    Object.freeze(this)
  }

  static create(input: CreateRoutineInput): Routine {
    return new Routine({
      id: Id.create(),
      userId: input.userId,
      name: RoutineName.create(input.name),
      entries: [],
      archivedOn: null,
      createdAt: new Date(input.createdAt ?? Date.now()),
    })
  }

  static restore(props: RoutineProps): Routine {
    return new Routine({
      ...props,
      entries: [...props.entries].sort((left, right) => left.position - right.position),
      archivedOn: props.archivedOn === null ? null : new Date(props.archivedOn),
      createdAt: new Date(props.createdAt),
    })
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get name(): RoutineName {
    return this.props.name
  }

  get entries(): readonly RoutineEntry[] {
    return this.props.entries
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  get archivedOn(): Date | null {
    return this.props.archivedOn === null ? null : new Date(this.props.archivedOn)
  }

  get isArchived(): boolean {
    return this.props.archivedOn !== null
  }

  withExercise(input: AddEntryInput): Routine {
    const entry = RoutineEntry.create(input, this.props.entries.length + 1)

    return new Routine({ ...this.props, entries: [...this.props.entries, entry] })
  }

  withoutEntry(entryId: Id): Routine {
    this.entryOrFail(entryId)

    const remaining = this.props.entries.filter((entry) => !entry.id.equals(entryId))

    return new Routine({ ...this.props, entries: Routine.renumbered(remaining) })
  }

  /**
   * Reorder by naming every entry exactly once.
   *
   * A partial order is refused rather than interpreted: filling in the gaps
   * would mean guessing, and guessing wrong silently drops an exercise from
   * the plan.
   */
  reordered(entryIds: readonly Id[]): Routine {
    const unique = new Set(entryIds.map((id) => id.value))

    if (unique.size !== entryIds.length || unique.size !== this.props.entries.length) {
      throw new InvalidRoutineOrderError(
        'A reorder must name every entry in the routine exactly once.',
      )
    }

    const ordered = entryIds.map((id) => this.entryOrFail(id))

    return new Routine({ ...this.props, entries: Routine.renumbered(ordered) })
  }

  withEntryChanged(entryId: Id, change: ChangeEntryInput): Routine {
    const target = this.entryOrFail(entryId)

    return new Routine({
      ...this.props,
      entries: this.props.entries.map((entry) =>
        entry.id.equals(target.id) ? entry.changed(change) : entry,
      ),
    })
  }

  renamedTo(name: string): Routine {
    return new Routine({ ...this.props, name: RoutineName.create(name) })
  }

  archivedAt(instant: Date): Routine {
    return new Routine({ ...this.props, archivedOn: new Date(instant) })
  }

  unarchived(): Routine {
    return new Routine({ ...this.props, archivedOn: null })
  }

  equals(other: Routine): boolean {
    return this.props.id.equals(other.id)
  }

  private entryOrFail(entryId: Id): RoutineEntry {
    const entry = this.props.entries.find((candidate) => candidate.id.equals(entryId))

    if (entry === undefined) {
      throw new RoutineEntryNotFoundError('That exercise is not in this routine.')
    }
    return entry
  }

  private static renumbered(entries: readonly RoutineEntry[]): readonly RoutineEntry[] {
    return entries.map((entry, index) => entry.atPosition(index + 1))
  }
}
