import { DrizzleRepository, type SortColumns } from '@api/common/persistence/drizzle.repository.js'
import { type CriteriaConditions, where } from '@api/common/persistence/drizzle-criteria.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type {
  SetCriteriaFields,
  SetRepository,
  SetSortField,
} from '@gym/domain/measurement/repositories/set.repository'
import type { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { eq, isNull, type SQL, sql } from 'drizzle-orm'
import { setMapper } from './set.mapper.js'

type LoggedSetRow = typeof loggedSet.$inferSelect

export class DrizzleSetRepository
  extends DrizzleRepository<LoggedSet, LoggedSetRow, SetCriteriaFields, SetSortField>
  implements SetRepository
{
  protected readonly table = loggedSet

  protected readonly conditions: CriteriaConditions<SetCriteriaFields> = {
    id: where.equals(loggedSet.id),
    ids: where.oneOf(loggedSet.id),
    sessionId: where.equals(loggedSet.sessionId),
    exerciseId: where.equals(loggedSet.exerciseId),
    mode: where.equals(loggedSet.mode),
    loggedBetween: where.within(loggedSet.loggedAt),
  }

  protected readonly sortColumns: SortColumns<SetSortField> = {
    loggedAt: loggedSet.loggedAt,
  }

  protected toDomain(row: LoggedSetRow): LoggedSet {
    return setMapper.toDomain(row)
  }

  /**
   * A deleted set is tombstoned rather than removed, so every read excludes
   * tombstones on top of whatever the caller asked for.
   */
  protected override where(criteria: Criteria<SetCriteriaFields>): SQL | undefined {
    const declared = super.where(criteria)
    const alive = isNull(loggedSet.deletedAt)

    return declared === undefined ? alive : (sql`${alive} AND ${declared}` as SQL)
  }

  async save(set: LoggedSet): Promise<void> {
    await this.saveMany([set])
  }

  /**
   * Upsert on the client-generated id.
   *
   * This is what makes synchronisation idempotent: a set delivered twice
   * because its acknowledgement was lost lands on the same row instead of
   * creating a duplicate. The revision guard keeps a replayed older edit from
   * overwriting a newer correction.
   */
  async saveMany(sets: readonly LoggedSet[]): Promise<void> {
    if (sets.length === 0) {
      return
    }

    await this.database
      .insert(loggedSet)
      .values(sets.map((set) => setMapper.toRow(set)))
      .onConflictDoUpdate({
        target: loggedSet.id,
        set: {
          reps: sql`excluded.reps`,
          rawValue: sql`excluded.raw_value`,
          resolvedGrams: sql`excluded.resolved_grams`,
          stackPosition: sql`excluded.stack_position`,
          revision: sql`excluded.revision`,
          syncedAt: new Date(),
        },
        setWhere: sql`${loggedSet.revision} <= excluded.revision`,
      })
  }

  /** Soft delete: a tombstone stops a replayed create from resurrecting the set. */
  async delete(id: string): Promise<void> {
    await this.database.update(loggedSet).set({ deletedAt: new Date() }).where(eq(loggedSet.id, id))
  }
}
