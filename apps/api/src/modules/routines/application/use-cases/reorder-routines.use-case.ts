import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
} from '@gym/domain/routines/repositories/routine.repository'
import { reorderRoutines } from '@gym/domain/routines/services/routine-order.service'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ReorderRoutinesInput {
  readonly userId: string
  /** Every active routine of the user, exactly once, in the order they should appear. */
  readonly routineIds: readonly string[]
}

/**
 * Put the user's active routines in their own order.
 *
 * Only the caller's own active routines can be named, so another user's
 * routine id is refused the same way as a missing one.
 */
@Injectable()
export class ReorderRoutinesUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: ReorderRoutinesInput): Promise<readonly Routine[]> {
    const active = await this.routines.findMany(
      Criteria.create<RoutineCriteriaFields>({ userId: input.userId, archived: false }),
      Pagination.create({ limit: 200 }),
    )
    const reordered = reorderRoutines(
      active.items,
      input.routineIds.map((id) => Id.restore(id)),
    )

    await this.routines.saveAll(reordered)
    return reordered
  }
}
