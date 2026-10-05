import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
} from '@gym/domain/routines/repositories/routine.repository'
import { nextRoutinePosition } from '@gym/domain/routines/services/routine-order.service'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface CreateRoutineInput {
  readonly userId: string
  readonly name: string
}

@Injectable()
export class CreateRoutineUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  /** A new routine goes last in the user's order, archived routines included. */
  async execute(input: CreateRoutineInput): Promise<Routine> {
    const existing = await this.routines.findMany(
      Criteria.create<RoutineCriteriaFields>({ userId: input.userId }),
      // Clamped to the largest page; a user with more routines than that is not a real case.
      Pagination.create({ limit: 200 }),
    )
    const routine = Routine.create({
      userId: Id.restore(input.userId),
      name: input.name,
      position: nextRoutinePosition(existing.items),
    })

    await this.routines.save(routine)
    return routine
  }
}
