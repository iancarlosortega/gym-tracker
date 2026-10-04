import { USER_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import { EQUIPMENT_REPOSITORY, EXERCISE_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import { findOwnedWorkout } from '@api/modules/workouts/application/use-cases/find-workout.js'
import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import {
  EquipmentCannotMeasureThatWayError,
  EquipmentNotFoundError,
  ExerciseNotFoundError,
  StackPositionOutOfRangeError,
} from '@gym/domain/catalog/errors'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import type { DisplayUnit } from '@gym/domain/measurement/value-objects/grams.vo'
import { grams } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  LoadEntry,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { WorkoutAlreadyFinishedError } from '@gym/domain/workouts/errors'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface LogSetInput {
  /** UUIDv7 generated on the device. The idempotency key for the whole sync. */
  readonly id: string
  readonly exerciseId: string
  readonly equipmentId: string
  /** The load in grams, for TOTAL and PER_SIDE. Per-side value for PER_SIDE. */
  readonly grams?: number | undefined
  /** The pin position, for STACK_POSITION. */
  readonly position?: number | undefined
  readonly reps: number
  readonly loggedAt: Date
}

export interface LogSetsInput {
  readonly userId: string
  readonly sessionId: string
  readonly sets: readonly LogSetInput[]
}

/**
 * Record sets performed during a workout.
 *
 * A batch rather than one set at a time, because a device that was offline
 * comes back with everything it could not send: one call, one upsert, one
 * acknowledgement to act on. A batch of one is the online path.
 *
 * The measurement mode is read from the exercise and the bar weight from the
 * equipment — never from the request. A client that could name its own mode
 * could turn a plate position into kilograms, and the snapshot on each set is
 * the record that makes a later recomputation honest.
 */
@Injectable()
export class LogSetsUseCase {
  constructor(
    @Inject(SET_REPOSITORY) private readonly sets: SetRepository,
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(EXERCISE_REPOSITORY) private readonly exercises: ExerciseRepository,
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: LogSetsInput): Promise<readonly LoggedSet[]> {
    const session = await findOwnedWorkout(this.sessions, input.userId, input.sessionId)

    // A set logged before the finish still belongs to the workout, however late
    // it arrives: the phone queues sets offline and may only reach the server
    // after the user has pressed finish. One set logged after the finish means
    // the batch is not this workout's, and nothing of it is written.
    const finishedOn = session.finishedOn
    if (finishedOn !== null && input.sets.some((set) => set.loggedAt > finishedOn)) {
      throw new WorkoutAlreadyFinishedError('That workout has already been finished.')
    }

    const displayUnit = await this.displayUnitOf(input.userId)

    const logged: LoggedSet[] = []
    for (const set of input.sets) {
      logged.push(await this.toLoggedSet(input, set, displayUnit))
    }

    await this.sets.saveMany(logged)
    return logged
  }

  private async toLoggedSet(
    input: LogSetsInput,
    set: LogSetInput,
    displayUnit: DisplayUnit,
  ): Promise<LoggedSet> {
    const exercise = await this.exercises.findOne(
      Criteria.create<ExerciseCriteriaFields>({ id: set.exerciseId, userId: input.userId }),
    )
    if (exercise === null) {
      throw new ExerciseNotFoundError('That exercise does not exist.')
    }

    const equipment = await this.equipmentFor(set, input.userId, exercise.defaultMode)
    const entry = this.entryFor(set, equipment, exercise.defaultMode)

    return LoggedSet.create({
      id: set.id,
      sessionId: input.sessionId,
      exerciseId: set.exerciseId,
      equipmentId: set.equipmentId,
      entry,
      reps: reps(set.reps),
      loggedAt: set.loggedAt,
      snapshot: {
        barGrams: exercise.defaultMode === 'PER_SIDE' ? equipment.barGrams : null,
        displayUnit,
        equipmentId: set.equipmentId,
      },
    })
  }

  /** The unit the user was reading when they typed the load; recorded, never trusted from the client. */
  private async displayUnitOf(userId: string): Promise<DisplayUnit> {
    const user = await this.users.findOne(Criteria.create<UserCriteriaFields>({ id: userId }))

    if (user === null) {
      // The caller passed the guard, so the account was deleted mid-session.
      throw new AuthenticationFailedError('That account no longer exists.')
    }
    return user.displayUnit
  }

  private async equipmentFor(
    set: LogSetInput,
    userId: string,
    mode: MeasurementMode,
  ): Promise<Equipment> {
    const found = await this.equipment.findOne(
      Criteria.create<EquipmentCriteriaFields>({ id: set.equipmentId, userId }),
    )

    if (found === null) {
      throw new EquipmentNotFoundError('That equipment does not exist.')
    }
    if (!found.supports(mode)) {
      throw new EquipmentCannotMeasureThatWayError(
        'That equipment cannot express how this exercise is measured.',
      )
    }
    return found
  }

  /**
   * The exercise decides how its load is read.
   *
   * A pin position above what the stack holds is refused here: the number
   * would round-trip happily and mean nothing, and an ordinal that names a
   * position the machine does not have is not comparable to anything.
   */
  private entryFor(set: LogSetInput, equipment: Equipment, mode: MeasurementMode): LoadEntry {
    if (mode === 'STACK_POSITION') {
      const position = stackPosition(set.position ?? Number.NaN)

      if (!equipment.allowsPosition(position)) {
        throw new StackPositionOutOfRangeError(
          `That machine has ${equipment.stackPositions ?? 0} positions, so position ${position} does not exist.`,
        )
      }
      return LoadEntry.stack(position)
    }

    const load = grams(set.grams ?? Number.NaN)

    return mode === 'PER_SIDE'
      ? LoadEntry.perSide(load, equipment.barGrams ?? grams(Number.NaN))
      : LoadEntry.total(load)
  }
}
