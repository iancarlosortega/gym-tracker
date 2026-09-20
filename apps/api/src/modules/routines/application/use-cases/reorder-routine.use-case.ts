import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface ReorderRoutineInput {
  readonly userId: string
  readonly routineId: string
  /** Every entry, exactly once, in the order they should appear. */
  readonly entryIds: readonly string[]
}

@Injectable()
export class ReorderRoutineUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: ReorderRoutineInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)
    const updated = routine.reordered(input.entryIds.map((id) => Id.restore(id)))

    await this.routines.save(updated)
    return updated
  }
}
