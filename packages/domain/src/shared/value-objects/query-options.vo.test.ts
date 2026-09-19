import { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'
import { describe, expect, it } from 'vitest'

type SortField = 'loggedAt' | 'reps'

describe('query options', () => {
  it('defaults to no ordering and no limit', () => {
    const options = QueryOptions.none<SortField>()
    expect(options.orderBy).toBeNull()
    expect(options.limit).toBeNull()
    expect(options.offset).toBe(0)
  })

  it('orders ascending and descending by returning new instances', () => {
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

  it('limits and offsets', () => {
    const page = QueryOptions.none<SortField>().limitedTo(20).offsetBy(40)
    expect(page.limit).toBe(20)
    expect(page.offset).toBe(40)
  })

  it('rejects a limit that is not a positive whole number', () => {
    expect(() => QueryOptions.none<SortField>().limitedTo(0)).toThrow(/limit/i)
    expect(() => QueryOptions.none<SortField>().limitedTo(2.5)).toThrow(/limit/i)
  })

  it('rejects a negative offset', () => {
    expect(() => QueryOptions.none<SortField>().offsetBy(-1)).toThrow(/offset/i)
  })
})
