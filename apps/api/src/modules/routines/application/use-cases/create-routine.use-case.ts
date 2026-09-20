import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface CreateRoutineInput {
  readonly userId: string
  readonly name: string
}

@Injectable()
export class CreateRoutineUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: CreateRoutineInput): Promise<Routine> {
    const routine = Routine.create({ userId: Id.restore(input.userId), name: input.name })

    await this.routines.save(routine)
    return routine
  }
}
