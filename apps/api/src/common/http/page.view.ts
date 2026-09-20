import type { Page } from '@gym/domain/shared/value-objects/page.vo'

/**
 * How a page of results looks over the wire.
 *
 * `hasMore` rather than a total: the extra row that answers "is there another
 * page?" costs nothing, while counting the whole table on every list is the
 * expense pagination exists to avoid.
 */
export interface PageView<TItem> {
  readonly items: readonly TItem[]
  readonly limit: number
  readonly offset: number
  readonly hasMore: boolean
}

export function toPageView<TItem>(page: Page<TItem>): PageView<TItem> {
  return {
    items: page.items,
    limit: page.limit,
    offset: page.offset,
    hasMore: page.hasMore,
  }
}
