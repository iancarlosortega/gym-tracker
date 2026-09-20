import { EQUIPMENT_REPOSITORY, EXERCISE_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import {
  EquipmentCannotMeasureThatWayError,
  ExerciseNotFoundError,
} from '@gym/domain/catalog/errors'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { RestDuration } from '@gym/domain/routines/value-objects/rest-duration.vo'
import { TargetReps } from '@gym/domain/routines/value-objects/target-reps.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface AddRoutineExerciseInput {
  readonly userId: string
  readonly routineId: string
  readonly exerciseId: string
  readonly equipmentId?: string | undefined
  readonly targetSets?: number | undefined
  readonly targetRepsMin?: number | undefined
  readonly targetRepsMax?: number | undefined
  readonly restSeconds?: number | undefined
}

@Injectable()
export class AddRoutineExerciseUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(EXERCISE_REPOSITORY) private readonly exercises: ExerciseRepository,
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository,
  ) {}

  async execute(input: AddRoutineExerciseInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)

    const exercise = await this.exercises.findOne(
      Criteria.create<ExerciseCriteriaFields>({ id: input.exerciseId, userId: input.userId }),
    )
    if (exercise === null) {
      throw new ExerciseNotFoundError('That exercise does not exist.')
    }

    const equipmentId = await this.resolveEquipment(input, exercise.defaultMode)

    const updated = routine.withExercise({
      exerciseId: Id.restore(input.exerciseId),
      equipmentId,
      targetSets: input.targetSets ?? null,
      targetReps: this.targetReps(input),
      rest: input.restSeconds === undefined ? undefined : RestDuration.create(input.restSeconds),
    })

    await this.routines.save(updated)
    return updated
  }

  /**
   * Equipment must be able to express the exercise's measurement mode.
   *
   * Pairing a plate-counted exercise with a barbell, or a per-side lift with a
   * machine, would produce sets nobody can interpret later — so it is refused
   * here rather than discovered at the rack.
   */
  private async resolveEquipment(
    input: AddRoutineExerciseInput,
    mode: MeasurementMode,
  ): Promise<Id | null> {
    if (input.equipmentId === undefined) {
      return null
    }

    const found = await this.equipment.findOne(
      Criteria.create<EquipmentCriteriaFields>({ id: input.equipmentId, userId: input.userId }),
    )
    if (found === null || !found.supports(mode)) {
      throw new EquipmentCannotMeasureThatWayError(
        'That equipment cannot express how this exercise is measured.',
      )
    }

    return Id.restore(input.equipmentId)
  }

  private targetReps(input: AddRoutineExerciseInput): TargetReps | null {
    if (input.targetRepsMin === undefined) {
      return null
    }
    return TargetReps.create(input.targetRepsMin, input.targetRepsMax ?? input.targetRepsMin)
  }
}
