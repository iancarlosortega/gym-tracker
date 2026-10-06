import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import type { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'
import type { WorkoutSession } from '@domain/workouts/entities/workout-session.entity.js'

export interface WorkoutSessionCriteriaFields {
  readonly id?: string
  readonly userId?: string
  readonly routineId?: string
  /** Backed by finished_at: true selects finished sessions, false open ones. */
  readonly finished?: boolean
}

export type WorkoutSessionCriteria = Criteria<WorkoutSessionCriteriaFields>

export type WorkoutSessionSortField = 'startedAt'

export type WorkoutSessionQueryOptions = QueryOptions<WorkoutSessionSortField>

/**
 * Persistence boundary for workout sessions.
 *
 * Sets are reached through `SetRepository` with the session's id, so a
 * session can be opened and resumed without reading everything logged in it.
 */
export interface WorkoutSessionRepository {
  save(session: WorkoutSession): Promise<void>
  findOne(criteria: WorkoutSessionCriteria): Promise<WorkoutSession | null>
  /** Pagination is required, so an unbounded read cannot be expressed here. */
  findMany(
    criteria: WorkoutSessionCriteria,
    pagination: Pagination,
    options?: WorkoutSessionQueryOptions,
  ): Promise<Page<WorkoutSession>>
  count(criteria: WorkoutSessionCriteria): Promise<number>
  /** Removes the session and everything logged in it. Silent when it is not there. */
  delete(id: string): Promise<void>
}
