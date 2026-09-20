import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import type { MeasurementMode } from '@domain/measurement/value-objects/load-entry.vo.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import type { DateRange } from '@domain/shared/value-objects/date-range.vo.js'
import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import type { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'

/**
 * The filters a logged set may be selected by.
 *
 * Deliberately closed: every field here is a query the application actually
 * makes, so adding one is a decision rather than an accident. This is what
 * keeps the repository from drifting into a small ORM.
 */
export interface SetCriteriaFields {
  readonly id?: string
  readonly ids?: readonly string[]
  readonly sessionId?: string
  readonly exerciseId?: string
  readonly mode?: MeasurementMode
  readonly loggedBetween?: DateRange
}

export type SetCriteria = Criteria<SetCriteriaFields>

export type SetSortField = 'loggedAt'

export type SetQueryOptions = QueryOptions<SetSortField>

/**
 * Persistence boundary for logged sets.
 *
 * Two adapters implement this port: Drizzle against Postgres on the server,
 * and IndexedDB on the device. Synchronisation is therefore draining one
 * implementation into another rather than a separate code path, and both are
 * held to the same contract tests.
 */
export interface SetRepository {
  save(set: LoggedSet): Promise<void>
  saveMany(sets: readonly LoggedSet[]): Promise<void>
  findOne(criteria: SetCriteria): Promise<LoggedSet | null>
  /** Pagination is required, so an unbounded read cannot be expressed here. */
  findMany(
    criteria: SetCriteria,
    pagination: Pagination,
    options?: SetQueryOptions,
  ): Promise<Page<LoggedSet>>
  count(criteria: SetCriteria): Promise<number>
  delete(id: string): Promise<void>
}
