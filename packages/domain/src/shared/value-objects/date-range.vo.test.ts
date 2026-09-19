import { describe, expect, it } from 'vitest'
import { DateRange } from './date-range.vo.ts'

const monday = new Date('2026-09-14T00:00:00.000Z')
const sunday = new Date('2026-09-20T23:59:59.999Z')

describe('date range', () => {
  it('exposes its bounds', () => {
    const range = DateRange.between(monday, sunday)
    expect(range.start).toEqual(monday)
    expect(range.end).toEqual(sunday)
  })

  it('rejects a range that ends before it starts', () => {
    expect(() => DateRange.between(sunday, monday)).toThrow(/before/i)
  })

  it('accepts an instant as a zero-length range', () => {
    expect(() => DateRange.between(monday, monday)).not.toThrow()
  })

  it('does not alias the dates it was given', () => {
    const start = new Date(monday)
    const range = DateRange.between(start, sunday)
    start.setFullYear(1999)
    expect(range.start.getFullYear()).toBe(2026)
  })

  it('knows whether an instant falls inside it, bounds included', () => {
    const range = DateRange.between(monday, sunday)
    expect(range.contains(monday)).toBe(true)
    expect(range.contains(sunday)).toBe(true)
    expect(range.contains(new Date('2026-09-17T12:00:00.000Z'))).toBe(true)
    expect(range.contains(new Date('2026-09-21T00:00:00.000Z'))).toBe(false)
  })
})
