import { RestDuration } from '@domain/routines/value-objects/rest-duration.vo.js'
import type { TargetReps } from '@domain/routines/value-objects/target-reps.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export interface RoutineEntryProps {
  readonly id: Id
  readonly exerciseId: Id
  /** Optional: the machine or bar this entry expects, when it matters. */
  readonly equipmentId: Id | null
  readonly position: number
  readonly targetSets: number | null
  readonly targetReps: TargetReps | null
  readonly rest: RestDuration
}

export interface AddEntryInput {
  readonly exerciseId: Id
  readonly equipmentId?: Id | null | undefined
  readonly targetSets?: number | null | undefined
  readonly targetReps?: TargetReps | null | undefined
  readonly rest?: RestDuration | undefined
}

export interface ChangeEntryInput {
  readonly equipmentId?: Id | null | undefined
  readonly targetSets?: number | null | undefined
  readonly targetReps?: TargetReps | null | undefined
  readonly rest?: RestDuration | undefined
}

/**
 * One exercise within a routine.
 *
 * A child of the Routine aggregate: it is never loaded or saved on its own,
 * and its position is meaningful only relative to its siblings, which is why
 * ordering lives on the routine rather than here.
 */
export class RoutineEntry {
  private constructor(private readonly props: RoutineEntryProps) {
    Object.freeze(this)
  }

  static create(input: AddEntryInput, position: number): RoutineEntry {
    return new RoutineEntry({
      id: Id.create(),
      exerciseId: input.exerciseId,
      equipmentId: input.equipmentId ?? null,
      position,
      targetSets: input.targetSets ?? null,
      targetReps: input.targetReps ?? null,
      rest: input.rest ?? RestDuration.default(),
    })
  }

  static restore(props: RoutineEntryProps): RoutineEntry {
    return new RoutineEntry(props)
  }

  get id(): Id {
    return this.props.id
  }

  get exerciseId(): Id {
    return this.props.exerciseId
  }

  get equipmentId(): Id | null {
    return this.props.equipmentId
  }

  get position(): number {
    return this.props.position
  }

  get targetSets(): number | null {
    return this.props.targetSets
  }

  get targetReps(): TargetReps | null {
    return this.props.targetReps
  }

  get rest(): RestDuration {
    return this.props.rest
  }

  atPosition(position: number): RoutineEntry {
    return new RoutineEntry({ ...this.props, position })
  }

  changed(input: ChangeEntryInput): RoutineEntry {
    return new RoutineEntry({
      ...this.props,
      equipmentId: input.equipmentId === undefined ? this.props.equipmentId : input.equipmentId,
      targetSets: input.targetSets === undefined ? this.props.targetSets : input.targetSets,
      targetReps: input.targetReps === undefined ? this.props.targetReps : input.targetReps,
      rest: input.rest ?? this.props.rest,
    })
  }

  equals(other: RoutineEntry): boolean {
    return this.props.id.equals(other.id)
  }
}
