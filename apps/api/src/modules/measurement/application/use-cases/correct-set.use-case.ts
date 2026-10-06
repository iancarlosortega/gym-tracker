import { EQUIPMENT_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import { findOwnedSet } from '@api/modules/measurement/application/use-cases/find-set.js'
import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import { StackPositionOutOfRangeError } from '@gym/domain/catalog/errors'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import type { LoadCorrection, LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { grams } from '@gym/domain/measurement/value-objects/grams.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface CorrectSetInput {
  readonly userId: string
  readonly setId: string
  /** The load as typed: the per-side value for a PER_SIDE set. */
  readonly grams?: number
  readonly position?: number
  readonly reps: number
}

/**
 * Fix a typo in a logged set, in an open workout or a finished one.
 *
 * Only what was entered changes. The set keeps the snapshot it was logged
 * with, so the entity resolves the new load against that, not the equipment
 * as it is today.
 */
@Injectable()
export class CorrectSetUseCase {
  constructor(
    @Inject(SET_REPOSITORY) private readonly sets: SetRepository,
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository,
  ) {}

  async execute(input: CorrectSetInput): Promise<LoggedSet> {
    const set = await findOwnedSet(this.sets, this.sessions, input.userId, input.setId)
    const load = await this.loadFor(set, input)

    const corrected = set.correct({ load, reps: reps(input.reps) })
    await this.sets.save(corrected)
    return corrected
  }

  private async loadFor(set: LoggedSet, input: CorrectSetInput): Promise<LoadCorrection> {
    if (input.position === undefined) {
      return { grams: grams(input.grams ?? Number.NaN) }
    }

    const position = stackPosition(input.position)

    if (set.entry.mode === 'STACK_POSITION') {
      const machine = await this.equipment.findOne(
        Criteria.create<EquipmentCriteriaFields>({ id: set.equipmentId, userId: input.userId }),
      )

      // A machine deleted since cannot vouch for the position; the set still can.
      if (machine !== null && !machine.allowsPosition(position)) {
        throw new StackPositionOutOfRangeError(
          `That machine has ${machine.stackPositions ?? 0} positions, so position ${position} does not exist.`,
        )
      }
    }
    return { position }
  }
}
