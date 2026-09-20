import type { Exercise } from '@domain/catalog/entities/exercise.entity.js'
import type { MeasurementMode } from '@domain/measurement/value-objects/load-entry.vo.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import type { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'

export interface ExerciseCriteriaFields {
  readonly id?: string
  readonly userId?: string
  readonly name?: string
  readonly defaultMode?: MeasurementMode
  /** Omitted means both; false excludes archived exercises from routine building. */
  readonly archived?: boolean
}

export type ExerciseCriteria = Criteria<ExerciseCriteriaFields>

export type ExerciseSortField = 'name' | 'createdAt'

export type ExerciseQueryOptions = QueryOptions<ExerciseSortField>

export interface ExerciseRepository {
  save(exercise: Exercise): Promise<void>
  findOne(criteria: ExerciseCriteria): Promise<Exercise | null>
  /** Pagination is required, so an unbounded read cannot be expressed here. */
  findMany(
    criteria: ExerciseCriteria,
    pagination: Pagination,
    options?: ExerciseQueryOptions,
  ): Promise<Page<Exercise>>
  count(criteria: ExerciseCriteria): Promise<number>
}
