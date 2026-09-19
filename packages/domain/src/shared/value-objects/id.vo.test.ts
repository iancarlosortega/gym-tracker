import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('id', () => {
  it('generates a UUIDv7 without anyone having to supply one', () => {
    expect(Id.create().value).toMatch(UUID_V7)
  })

  it('generates a distinct value every time', () => {
    const generated = new Set(Array.from({ length: 500 }, () => Id.create().value))
    expect(generated.size).toBe(500)
  })

  it('sorts in creation order, which keeps database indexes local', () => {
    const first = Id.create()
    const later = Id.createAt(new Date(Date.now() + 60_000))

    expect(first.value < later.value).toBe(true)
  })

  it('restores a known value unchanged', () => {
    const value = '0199a1f0-0000-7000-8000-000000000001'
    expect(Id.restore(value).value).toBe(value)
  })

  it('rejects a value that is not a UUID', () => {
    expect(() => Id.restore('not-a-uuid')).toThrow(/uuid/i)
  })

  it('compares by value', () => {
    const value = '0199a1f0-0000-7000-8000-000000000001'
    expect(Id.restore(value).equals(Id.restore(value))).toBe(true)
    expect(Id.restore(value).equals(Id.create())).toBe(false)
  })
})
