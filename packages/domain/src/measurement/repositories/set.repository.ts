import type { Criteria } from '../../shared/value-objects/criteria.vo.ts'
import type { DateRange } from '../../shared/value-objects/date-range.vo.ts'
import type { QueryOptions } from '../../shared/value-objects/query-options.vo.ts'
import type { LoggedSet } from '../entities/logged-set.entity.ts'
import type { MeasurementMode } from '../value-objects/load-entry.vo.ts'

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
  findMany(criteria: SetCriteria, options?: SetQueryOptions): Promise<readonly LoggedSet[]>
  count(criteria: SetCriteria): Promise<number>
  delete(id: string): Promise<void>
}
