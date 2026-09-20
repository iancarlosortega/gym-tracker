export type SortDirection = 'asc' | 'desc'

/**
 * Immutable ordering for a repository query.
 *
 * Ordering only: the window a query returns is owned by `Pagination`, which
 * every read takes. Two ways to limit a result set would eventually disagree.
 *
 * `TSortField` is declared per repository and lists only the fields that
 * repository can order by, so an adapter never receives a sort key it cannot
 * translate.
 */
export class QueryOptions<TSortField extends string> {
  private constructor(
    private readonly sortField: TSortField | null,
    private readonly sortDirection: SortDirection,
  ) {
    Object.freeze(this)
  }

  static none<TSortField extends string>(): QueryOptions<TSortField> {
    return new QueryOptions<TSortField>(null, 'asc')
  }

  get orderBy(): TSortField | null {
    return this.sortField
  }

  get direction(): SortDirection {
    return this.sortDirection
  }

  orderedBy(field: TSortField, direction: SortDirection = 'asc'): QueryOptions<TSortField> {
    return new QueryOptions(field, direction)
  }
}
