import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface RemoveRoutineEntryInput {
  readonly userId: string
  readonly routineId: string
  readonly entryId: string
}

@Injectable()
export class RemoveRoutineEntryUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: RemoveRoutineEntryInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)
    const updated = routine.withoutEntry(Id.restore(input.entryId))

    await this.routines.save(updated)
    return updated
  }
}
