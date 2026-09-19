import type { LoggedSet, SetCriteria, SetQueryOptions, SetRepository } from '@gym/domain'
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, type SQL, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { loggedSet } from '../../../../database/schema/logged-set.table.ts'
import { setMapper } from './set.mapper.ts'

export type MeasurementDatabase = PgDatabase<PgQueryResultHKT>

export class DrizzleSetRepository implements SetRepository {
  constructor(private readonly database: MeasurementDatabase) {}

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

    const rows = sets.map((set) => setMapper.toRow(set))

    await this.database
      .insert(loggedSet)
      .values(rows)
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

  async findOne(criteria: SetCriteria): Promise<LoggedSet | null> {
    const rows = await this.database
      .select()
      .from(loggedSet)
      .where(this.toCondition(criteria))
      .limit(1)

    const row = rows[0]
    return row === undefined ? null : setMapper.toDomain(row)
  }

  async findMany(criteria: SetCriteria, options?: SetQueryOptions): Promise<readonly LoggedSet[]> {
    const query = this.database
      .select()
      .from(loggedSet)
      .where(this.toCondition(criteria))
      .$dynamic()

    if (options?.orderBy === 'loggedAt') {
      query.orderBy(
        options.direction === 'desc' ? desc(loggedSet.loggedAt) : asc(loggedSet.loggedAt),
      )
    }
    if (options?.limit !== null && options?.limit !== undefined) {
      query.limit(options.limit)
    }
    if (options !== undefined && options.offset > 0) {
      query.offset(options.offset)
    }

    return (await query).map((row) => setMapper.toDomain(row))
  }

  async count(criteria: SetCriteria): Promise<number> {
    const rows = await this.database
      .select({ total: count() })
      .from(loggedSet)
      .where(this.toCondition(criteria))

    return rows[0]?.total ?? 0
  }

  /** Soft delete: a tombstone stops a replayed create from resurrecting the set. */
  async delete(id: string): Promise<void> {
    await this.database.update(loggedSet).set({ deletedAt: new Date() }).where(eq(loggedSet.id, id))
  }

  /**
   * Translate the closed criteria into SQL.
   *
   * Every branch here corresponds to one declared field, so a filter the
   * domain never sanctioned cannot reach the database.
   */
  private toCondition(criteria: SetCriteria): SQL | undefined {
    const conditions: SQL[] = [isNull(loggedSet.deletedAt)]

    const id = criteria.get('id')
    if (id !== undefined) {
      conditions.push(eq(loggedSet.id, id))
    }

    const ids = criteria.get('ids')
    if (ids !== undefined && ids.length > 0) {
      conditions.push(inArray(loggedSet.id, [...ids]))
    }

    const sessionId = criteria.get('sessionId')
    if (sessionId !== undefined) {
      conditions.push(eq(loggedSet.sessionId, sessionId))
    }

    const exerciseId = criteria.get('exerciseId')
    if (exerciseId !== undefined) {
      conditions.push(eq(loggedSet.exerciseId, exerciseId))
    }

    const mode = criteria.get('mode')
    if (mode !== undefined) {
      conditions.push(eq(loggedSet.mode, mode))
    }

    const range = criteria.get('loggedBetween')
    if (range !== undefined) {
      conditions.push(gte(loggedSet.loggedAt, range.start), lte(loggedSet.loggedAt, range.end))
    }

    return and(...conditions)
  }
}
