import { describe, expect, it } from 'vitest'
import { Page } from './page.vo.ts'
import { Pagination } from './pagination.vo.ts'

const firstPage = Pagination.create({ limit: 2 })

describe('a page of results', () => {
  it('carries its items, the window and the size of the whole', () => {
    const page = Page.create(['a', 'b'], 7, firstPage)

    expect(page.items).toEqual(['a', 'b'])
    expect(page.total).toBe(7)
    expect(page.limit).toBe(2)
    expect(page.offset).toBe(0)
  })

  it('knows a further page exists', () => {
    expect(Page.create(['a', 'b'], 7, firstPage).hasMore).toBe(true)
  })

  it('knows it is the last page', () => {
    expect(Page.create(['g'], 7, Pagination.create({ limit: 2, offset: 6 })).hasMore).toBe(false)
  })

  it('is empty without pretending there is more', () => {
    const page = Page.empty(firstPage)

    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
    expect(page.hasMore).toBe(false)
  })

  it('maps its items while keeping the window and the total', () => {
    const page = Page.create([1, 2], 7, firstPage).map(String)

    expect(page.items).toEqual(['1', '2'])
    expect(page.total).toBe(7)
    expect(page.hasMore).toBe(true)
  })
})
