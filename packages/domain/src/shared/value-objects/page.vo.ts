import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'

/**
 * A bounded slice of a result set, with the size of the whole.
 *
 * The total is carried because a client showing page numbers needs it; it is
 * counted with the same criteria as the page itself, so the two always agree.
 */
export class Page<TItem> {
  private constructor(
    readonly items: readonly TItem[],
    readonly total: number,
    private readonly window: Pagination,
  ) {
    Object.freeze(this)
  }

  static create<TItem>(items: readonly TItem[], total: number, window: Pagination): Page<TItem> {
    return new Page(items, total, window)
  }

  static empty<TItem>(window: Pagination): Page<TItem> {
    return new Page<TItem>([], 0, window)
  }

  get limit(): number {
    return this.window.limit
  }

  get offset(): number {
    return this.window.offset
  }

  get hasMore(): boolean {
    return this.window.offset + this.items.length < this.total
  }

  map<TMapped>(transform: (item: TItem) => TMapped): Page<TMapped> {
    return new Page(this.items.map(transform), this.total, this.window)
  }
}
