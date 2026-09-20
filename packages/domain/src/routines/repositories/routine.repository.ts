import type { Routine } from '@domain/routines/entities/routine.entity.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import type { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'

export interface RoutineCriteriaFields {
  readonly id?: string
  readonly userId?: string
  readonly name?: string
  readonly archived?: boolean
}

export type RoutineCriteria = Criteria<RoutineCriteriaFields>

export type RoutineSortField = 'name' | 'createdAt'

export type RoutineQueryOptions = QueryOptions<RoutineSortField>

/**
 * Routines are loaded and saved whole, entries included.
 *
 * The entries have no life outside their routine: their positions only mean
 * something relative to their siblings, so saving one on its own could leave
 * the order inconsistent.
 */
export interface RoutineRepository {
  save(routine: Routine): Promise<void>
  findOne(criteria: RoutineCriteria): Promise<Routine | null>
  /** Pagination is required, so an unbounded read cannot be expressed here. */
  findMany(
    criteria: RoutineCriteria,
    pagination: Pagination,
    options?: RoutineQueryOptions,
  ): Promise<Page<Routine>>
  count(criteria: RoutineCriteria): Promise<number>
}
