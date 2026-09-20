import { ExerciseName } from '@domain/catalog/value-objects/exercise-name.vo.js'
import { UnknownMeasurementModeError } from '@domain/measurement/errors.js'
import {
  MEASUREMENT_MODES,
  type MeasurementMode,
} from '@domain/measurement/value-objects/load-entry.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export interface CreateExerciseInput {
  readonly userId: Id
  readonly name: string
  readonly defaultMode: MeasurementMode
  readonly createdAt?: Date
}

export interface ExerciseProps {
  readonly id: Id
  readonly userId: Id
  readonly name: ExerciseName
  readonly defaultMode: MeasurementMode
  readonly archivedOn: Date | null
  readonly createdAt: Date
}

/**
 * A movement the user logs sets against.
 *
 * The measurement mode is fixed at creation and has no setter. Changing it
 * would silently reinterpret every set already logged under this exercise —
 * turning plate positions into kilograms, or the reverse — so a different mode
 * means a different exercise.
 */
export class Exercise {
  private constructor(private readonly props: ExerciseProps) {
    Object.freeze(this)
  }

  static create(input: CreateExerciseInput): Exercise {
    if (!MEASUREMENT_MODES.includes(input.defaultMode)) {
      throw new UnknownMeasurementModeError(
        `Unknown measurement mode ${String(input.defaultMode)}. Expected one of ${MEASUREMENT_MODES.join(', ')}.`,
      )
    }

    return new Exercise({
      id: Id.create(),
      userId: input.userId,
      name: ExerciseName.create(input.name),
      defaultMode: input.defaultMode,
      archivedOn: null,
      createdAt: new Date(input.createdAt ?? Date.now()),
    })
  }

  static restore(props: ExerciseProps): Exercise {
    return new Exercise({
      ...props,
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

  get name(): ExerciseName {
    return this.props.name
  }

  get defaultMode(): MeasurementMode {
    return this.props.defaultMode
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

  renamedTo(name: string): Exercise {
    return new Exercise({ ...this.props, name: ExerciseName.create(name) })
  }

  /**
   * Archiving hides the exercise from routine building. It never removes it,
   * because every set already logged against it must keep resolving.
   */
  archivedAt(instant: Date): Exercise {
    return new Exercise({ ...this.props, archivedOn: new Date(instant) })
  }

  unarchived(): Exercise {
    return new Exercise({ ...this.props, archivedOn: null })
  }

  equals(other: Exercise): boolean {
    return this.props.id.equals(other.id)
  }
}
