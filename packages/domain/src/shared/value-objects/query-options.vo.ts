import { InvalidQueryOptionError } from '@domain/shared/errors.js'

export type SortDirection = 'asc' | 'desc'

/**
 * Immutable ordering and pagination for a repository query.
 *
 * `TSortField` is declared per repository and lists only the fields that
 * repository can order by, so an adapter never receives a sort key it cannot
 * translate.
 */
export class QueryOptions<TSortField extends string> {
  private constructor(
    private readonly sortField: TSortField | null,
    private readonly sortDirection: SortDirection,
    private readonly maximum: number | null,
    private readonly skipped: number,
  ) {
    Object.freeze(this)
  }

  static none<TSortField extends string>(): QueryOptions<TSortField> {
    return new QueryOptions<TSortField>(null, 'asc', null, 0)
  }

  get orderBy(): TSortField | null {
    return this.sortField
  }

  get direction(): SortDirection {
    return this.sortDirection
  }

  get limit(): number | null {
    return this.maximum
  }

  get offset(): number {
    return this.skipped
  }

  orderedBy(field: TSortField, direction: SortDirection = 'asc'): QueryOptions<TSortField> {
    return new QueryOptions(field, direction, this.maximum, this.skipped)
  }

  limitedTo(count: number): QueryOptions<TSortField> {
    if (!Number.isInteger(count) || count < 1) {
      throw new InvalidQueryOptionError(
        `A query limit must be a whole number of 1 or more, received ${count}.`,
      )
    }
    return new QueryOptions(this.sortField, this.sortDirection, count, this.skipped)
  }

  offsetBy(count: number): QueryOptions<TSortField> {
    if (!Number.isInteger(count) || count < 0) {
      throw new InvalidQueryOptionError(
        `A query offset must be a whole number of 0 or more, received ${count}.`,
      )
    }
    return new QueryOptions(this.sortField, this.sortDirection, this.maximum, count)
  }
}
