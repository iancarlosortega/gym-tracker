import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { RestDuration } from '@gym/domain/routines/value-objects/rest-duration.vo'
import { TargetReps } from '@gym/domain/routines/value-objects/target-reps.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface ChangeRoutineEntryInput {
  readonly userId: string
  readonly routineId: string
  readonly entryId: string
  readonly targetSets?: number | undefined
  readonly targetRepsMin?: number | undefined
  readonly targetRepsMax?: number | undefined
  readonly restSeconds?: number | undefined
}

@Injectable()
export class ChangeRoutineEntryUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: ChangeRoutineEntryInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)

    const updated = routine.withEntryChanged(Id.restore(input.entryId), {
      targetSets: input.targetSets,
      targetReps:
        input.targetRepsMin === undefined
          ? undefined
          : TargetReps.create(input.targetRepsMin, input.targetRepsMax ?? input.targetRepsMin),
      rest: input.restSeconds === undefined ? undefined : RestDuration.create(input.restSeconds),
    })

    await this.routines.save(updated)
    return updated
  }
}
