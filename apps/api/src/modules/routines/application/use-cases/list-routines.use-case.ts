import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
  RoutineSortField,
} from '@gym/domain/routines/repositories/routine.repository'
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

@Injectable()
export class ListRoutinesUseCase {
  constructor(@Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository) {}

  async execute(input: ListRoutinesInput): Promise<Page<Routine>> {
    return await this.routines.findMany(
      Criteria.create<RoutineCriteriaFields>({
        userId: input.userId,
        archived: input.includeArchived === true ? undefined : false,
      }),
      Pagination.create({ limit: input.limit, offset: input.offset }),
      QueryOptions.none<RoutineSortField>().orderedBy('name'),
    )
  }
}
