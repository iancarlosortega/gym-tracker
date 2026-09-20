import type { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'
import { type AnyColumn, asc, count, desc, type SQL } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT, PgTable } from 'drizzle-orm/pg-core'
import { buildWhere, type CriteriaConditions } from './drizzle-criteria.js'

export type Database = PgDatabase<PgQueryResultHKT>

/** A column for every field a repository allows ordering by. */
export type SortColumns<TSortField extends string> = Record<TSortField, AnyColumn>

/**
 * Shared reading behaviour for every Drizzle-backed repository.
 *
 * Each repository declares two small maps — how its criteria fields become
 * conditions, and which column each sort field is — and inherits findOne,
 * findMany and count. What used to be forty lines of near-identical if
 * statements per repository becomes a table, and the mapped types make an
 * unmapped field a build error instead of a filter that quietly does nothing.
 *
 * Writing is deliberately not here: every aggregate has its own upsert rules,
 * and a shared save would have to guess at them.
 */
export abstract class DrizzleRepository<
  TEntity,
  TRow extends Record<string, unknown>,
  TFields extends object,
  TSortField extends string,
> {
  protected abstract readonly table: PgTable
  protected abstract readonly conditions: CriteriaConditions<TFields>
  protected abstract readonly sortColumns: SortColumns<TSortField>

  constructor(protected readonly database: Database) {}

  protected abstract toDomain(row: TRow): TEntity

  async findOne(criteria: Criteria<TFields>): Promise<TEntity | null> {
    const rows = await this.database.select().from(this.table).where(this.where(criteria)).limit(1)

    const row = rows[0]
    return row === undefined ? null : this.toDomain(row as TRow)
  }

  /**
   * The page and its total are read with the same criteria, so a client
   * showing page numbers can never see a count that disagrees with the rows.
   */
  async findMany(
    criteria: Criteria<TFields>,
    pagination: Pagination,
    options?: QueryOptions<TSortField>,
  ): Promise<Page<TEntity>> {
    const condition = this.where(criteria)

    const query = this.database.select().from(this.table).where(condition).$dynamic()

    const sortField = options?.orderBy
    if (sortField !== null && sortField !== undefined) {
      const column = this.sortColumns[sortField]
      query.orderBy(options?.direction === 'desc' ? desc(column) : asc(column))
    }

    const [rows, total] = await Promise.all([
      query.limit(pagination.limit).offset(pagination.offset),
      this.countWhere(condition),
    ])

    return Page.create(
      rows.map((row) => this.toDomain(row as TRow)),
      total,
      pagination,
    )
  }

  async count(criteria: Criteria<TFields>): Promise<number> {
    return await this.countWhere(this.where(criteria))
  }

  protected where(criteria: Criteria<TFields>): SQL | undefined {
    return buildWhere(criteria, this.conditions)
  }

  private async countWhere(condition: SQL | undefined): Promise<number> {
    const rows = await this.database.select({ total: count() }).from(this.table).where(condition)

    return rows[0]?.total ?? 0
  }
}
