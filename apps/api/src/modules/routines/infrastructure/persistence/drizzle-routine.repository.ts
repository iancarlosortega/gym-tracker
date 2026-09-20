import {
  type Database,
  DrizzleRepository,
  type SortColumns,
} from '@api/common/persistence/drizzle.repository.js'
import { type CriteriaConditions, where } from '@api/common/persistence/drizzle-criteria.js'
import { DATABASE } from '@api/database/database.module.js'
import { routine, routineExercise } from '@api/database/schema/routine.table.js'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteria,
  RoutineCriteriaFields,
  RoutineQueryOptions,
  RoutineRepository,
  RoutineSortField,
} from '@gym/domain/routines/repositories/routine.repository'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { Inject, Injectable } from '@nestjs/common'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { routineMapper } from './routine.mapper.js'

type RoutineRow = typeof routine.$inferSelect

/**
 * Routines are read and written whole.
 *
 * The base class supplies the criteria and sorting machinery; loading and
 * saving are overridden because an aggregate that returned without its entries
 * would be a routine with no exercises in it — silently, and only at the gym.
 */
@Injectable()
export class DrizzleRoutineRepository
  extends DrizzleRepository<Routine, RoutineRow, RoutineCriteriaFields, RoutineSortField>
  implements RoutineRepository
{
  constructor(@Inject(DATABASE) database: Database) {
    super(database)
  }

  protected readonly table = routine

  protected readonly conditions: CriteriaConditions<RoutineCriteriaFields> = {
    id: where.equals(routine.id),
    userId: where.equals(routine.userId),
    name: where.equalsIgnoringCase(routine.name),
    archived: where.markedBy(routine.archivedAt),
  }

  protected readonly sortColumns: SortColumns<RoutineSortField> = {
    name: routine.name,
    createdAt: routine.createdAt,
  }

  protected toDomain(row: RoutineRow): Routine {
    // Only reached through the hydrating reads below, which pass the entries.
    return routineMapper.toDomain(row, [])
  }

  override async findOne(criteria: RoutineCriteria): Promise<Routine | null> {
    const rows = await this.database.select().from(routine).where(this.where(criteria)).limit(1)

    const row = rows[0]
    if (row === undefined) {
      return null
    }

    const [hydrated] = await this.hydrate([row])
    return hydrated ?? null
  }

  override async findMany(
    criteria: RoutineCriteria,
    pagination: Pagination,
    options?: RoutineQueryOptions,
  ): Promise<Page<Routine>> {
    const condition = this.where(criteria)
    const query = this.database.select().from(routine).where(condition).$dynamic()

    const sortField = options?.orderBy
    if (sortField !== null && sortField !== undefined) {
      const column = this.sortColumns[sortField]
      query.orderBy(options?.direction === 'desc' ? desc(column) : asc(column))
    }

    const [rows, total] = await Promise.all([
      query.limit(pagination.limit).offset(pagination.offset),
      this.count(criteria),
    ])

    return Page.create(await this.hydrate(rows), total, pagination)
  }

  /**
   * Replace the entries wholesale inside one transaction.
   *
   * Positions are only meaningful as a set, so a partial write would leave a
   * routine with two exercises at position one or a gap where one was removed.
   */
  async save(model: Routine): Promise<void> {
    const row = routineMapper.toRow(model)
    const entries = routineMapper.entriesToRows(model)

    await this.database.transaction(async (transaction) => {
      await transaction
        .insert(routine)
        .values(row)
        .onConflictDoUpdate({
          target: routine.id,
          set: { name: row.name, archivedAt: row.archivedAt ?? null },
        })

      await transaction.delete(routineExercise).where(eq(routineExercise.routineId, model.id.value))

      if (entries.length > 0) {
        await transaction.insert(routineExercise).values(entries)
      }
    })
  }

  /** One query for every routine's entries rather than one per routine. */
  private async hydrate(rows: readonly RoutineRow[]): Promise<Routine[]> {
    if (rows.length === 0) {
      return []
    }

    const entryRows = await this.database
      .select()
      .from(routineExercise)
      .where(
        inArray(
          routineExercise.routineId,
          rows.map((row) => row.id),
        ),
      )

    return rows.map((row) =>
      routineMapper.toDomain(
        row,
        entryRows.filter((entry) => entry.routineId === row.id),
      ),
    )
  }
}
