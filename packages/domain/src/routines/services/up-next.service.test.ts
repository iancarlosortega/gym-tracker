import { describe, expect, it } from 'vitest'
import { upNext } from './up-next.service.ts'

const daysAgo = (days: number) => new Date(Date.UTC(2026, 9, 4) - days * 86_400_000)

const routine = (id: string, position: number, lastDoneAt: Date | null, archived = false) => ({
  id,
  position,
  archived,
  lastDoneAt,
})

describe('the next routine', () => {
  it('is the one whose last workout is oldest', () => {
    expect(upNext([routine('A', 0, daysAgo(3)), routine('B', 1, daysAgo(6))])).toBe('B')
  })

  it('is a never-done routine before any done one', () => {
    expect(upNext([routine('A', 0, daysAgo(10)), routine('C', 1, null)])).toBe('C')
  })

  it('follows routine order on a tie', () => {
    expect(upNext([routine('D', 1, null), routine('C', 0, null)])).toBe('C')
    expect(upNext([routine('D', 1, daysAgo(2)), routine('C', 0, daysAgo(2))])).toBe('C')
  })

  it('is never an archived routine', () => {
    expect(upNext([routine('E', 0, null, true), routine('A', 1, daysAgo(1))])).toBe('A')
  })

  it('is nothing when no routine is active', () => {
    expect(upNext([])).toBeNull()
    expect(upNext([routine('E', 0, null, true)])).toBeNull()
  })
})
