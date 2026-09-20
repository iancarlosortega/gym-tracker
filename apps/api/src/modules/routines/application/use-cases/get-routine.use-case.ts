import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface GetRoutineInput {
  readonly userId: string
  readonly routineId: string
}

@Injectable()
export class GetRoutineUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: GetRoutineInput): Promise<Routine> {
    return await findOwnedRoutine(this.routines, input.userId, input.routineId)
  }
}
