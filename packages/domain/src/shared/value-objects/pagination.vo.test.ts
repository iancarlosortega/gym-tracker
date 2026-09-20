import { describe, expect, it } from 'vitest'
import { Pagination } from './pagination.vo.ts'

describe('pagination', () => {
  it('applies a default page size when none is asked for', () => {
    const page = Pagination.create()

    expect(page.limit).toBe(50)
    expect(page.offset).toBe(0)
  })

  it('accepts a requested page size', () => {
    expect(Pagination.create({ limit: 10 }).limit).toBe(10)
  })

  it('clamps an oversized request instead of refusing it, so a client cannot drain the database', () => {
    expect(Pagination.create({ limit: 10_000 }).limit).toBe(200)
  })

  it('rejects a limit that is not a positive whole number', () => {
    expect(() => Pagination.create({ limit: 0 })).toThrow(/limit/i)
    expect(() => Pagination.create({ limit: 2.5 })).toThrow(/limit/i)
  })

  it('rejects a negative offset', () => {
    expect(() => Pagination.create({ offset: -1 })).toThrow(/offset/i)
  })

  it('derives the page after this one', () => {
    const next = Pagination.create({ limit: 20, offset: 0 }).next()

    expect(next.offset).toBe(20)
    expect(next.limit).toBe(20)
  })
})
