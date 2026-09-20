import { describe, expect, it } from 'vitest'
import { QueryOptions } from './query-options.vo.ts'

type SortField = 'loggedAt' | 'reps'

describe('query options', () => {
  it('defaults to no ordering', () => {
    expect(QueryOptions.none<SortField>().orderBy).toBeNull()
  })

  it('orders by returning a new instance', () => {
    const base = QueryOptions.none<SortField>()
    const newest = base.orderedBy('loggedAt', 'desc')

    expect(newest).not.toBe(base)
    expect(newest.orderBy).toBe('loggedAt')
    expect(newest.direction).toBe('desc')
    expect(base.orderBy).toBeNull()
  })

  it('defaults an ordering to ascending', () => {
    expect(QueryOptions.none<SortField>().orderedBy('reps').direction).toBe('asc')
  })

  it('carries no limit, because the window belongs to Pagination', () => {
    expect('limitedTo' in QueryOptions.none<SortField>()).toBe(false)
  })
})
