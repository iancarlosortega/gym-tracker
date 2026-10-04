import {
  ROUTINE_HISTORY_REPOSITORY,
  ROUTINE_REPOSITORY,
} from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
  RoutineSortField,
} from '@gym/domain/routines/repositories/routine.repository'
import type { RoutineHistoryRepository } from '@gym/domain/routines/repositories/routine-history.repository'
import { upNext } from '@gym/domain/routines/services/up-next.service'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { Page } from '@gym/domain/shared/value-objects/page.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ListRoutinesInput {
  readonly userId: string
  readonly includeArchived?: boolean | undefined
  readonly limit?: number | undefined
  readonly offset?: number | undefined
}

export interface RoutineListing {
  readonly page: Page<Routine>
  /** Routines never followed are absent. */
  readonly lastDoneAt: ReadonlyMap<string, Date>
  readonly upNextRoutineId: string | null
}

/**
 * The routines, when each was last done, and which one comes next.
 *
 * The routine order that breaks ties is the order this list is shown in.
 */
@Injectable()
export class ListRoutinesUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(ROUTINE_HISTORY_REPOSITORY) private readonly history: RoutineHistoryRepository,
  ) {}

  async execute(input: ListRoutinesInput): Promise<RoutineListing> {
    const [page, lastDoneAt] = await Promise.all([
      this.routines.findMany(
        Criteria.create<RoutineCriteriaFields>({
          userId: input.userId,
          archived: input.includeArchived === true ? undefined : false,
        }),
        Pagination.create({ limit: input.limit, offset: input.offset }),
        QueryOptions.none<RoutineSortField>().orderedBy('name'),
      ),
      this.history.lastDoneAt(input.userId),
    ])

    const upNextRoutineId = upNext(
      page.items.map((routine, position) => ({
        id: routine.id.value,
        position,
        archived: routine.isArchived,
        lastDoneAt: lastDoneAt.get(routine.id.value) ?? null,
      })),
    )

    return { page, lastDoneAt, upNextRoutineId }
  }
}
