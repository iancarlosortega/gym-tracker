import type { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import {
  type AnyColumn,
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  type SQL,
  sql,
} from 'drizzle-orm'

/** Turns one criteria value into a SQL condition. */
export type ConditionFor<TValue> = (value: TValue) => SQL

/**
 * A condition for every field a criteria type declares.
 *
 * The mapped type is the point: `-?` makes each key required, so adding a
 * field to a criteria type without saying how it is queried is a compile error
 * rather than a filter that silently does nothing. A filter that is ignored is
 * worse than one that fails — it returns confidently wrong results.
 */
export type CriteriaConditions<TFields extends object> = {
  [TKey in keyof TFields]-?: ConditionFor<NonNullable<TFields[TKey]>>
}

export function buildWhere<TFields extends object>(
  criteria: Criteria<TFields>,
  conditions: CriteriaConditions<TFields>,
): SQL | undefined {
  const parts: SQL[] = []

  for (const key of criteria.keys()) {
    const value = criteria.get(key)
    if (value === undefined) {
      continue
    }
    parts.push(conditions[key](value as NonNullable<TFields[typeof key]>))
  }

  return parts.length === 0 ? undefined : and(...parts)
}

/** The conditions a criteria field usually needs, named for what they mean. */
export const where = {
  equals:
    (column: AnyColumn) =>
    (value: string | number | boolean): SQL =>
      eq(column, value),

  /** Case-insensitive equality, for names the domain compares that way. */
  equalsIgnoringCase:
    (column: AnyColumn) =>
    (value: string): SQL =>
      sql`lower(${column}) = lower(${value})`,

  oneOf:
    (column: AnyColumn) =>
    (values: readonly string[]): SQL =>
      inArray(column, [...values]),

  /** A boolean field backed by a nullable timestamp, such as archived_at. */
  markedBy:
    (column: AnyColumn) =>
    (value: boolean): SQL =>
      value ? isNotNull(column) : isNull(column),

  within:
    (column: AnyColumn) =>
    (range: { start: Date; end: Date }): SQL =>
      and(gte(column, range.start), lte(column, range.end)) as SQL,
}
