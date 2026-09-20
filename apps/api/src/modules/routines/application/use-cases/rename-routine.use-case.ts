import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface RenameRoutineInput {
  readonly userId: string
  readonly routineId: string
  readonly name: string
}

@Injectable()
export class RenameRoutineUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: RenameRoutineInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)
    const renamed = routine.renamedTo(input.name)

    await this.routines.save(renamed)
    return renamed
  }
}
