import { PasswordHash } from '@domain/auth/value-objects/password-hash.vo.js'
import { describe, expect, it } from 'vitest'
import { User } from './user.entity.ts'

const passwordHash = PasswordHash.create('argon2id$hash')

describe('registering a user', () => {
  it('takes the address as written and normalises it', () => {
    const user = User.create({ email: '  Ian@Example.TEST ', passwordHash })

    expect(user.email.value).toBe('ian@example.test')
  })

  it('rejects an address that is not usable, before a user can exist with it', () => {
    expect(() => User.create({ email: 'not-an-email', passwordHash })).toThrow(/email/i)
  })

  it('generates its own identity', () => {
    const one = User.create({ email: 'ian@example.test', passwordHash })
    const another = User.create({ email: 'other@example.test', passwordHash })

    expect(one.id.value).toMatch(/^[0-9a-f-]{36}$/)
    expect(one.id.equals(another.id)).toBe(false)
  })

  it('defaults to kilograms, because that is what most of the world lifts in', () => {
    expect(User.create({ email: 'ian@example.test', passwordHash }).displayUnit).toBe('KG')
  })

  it('accepts a display unit when one is given', () => {
    const user = User.create({ email: 'ian@example.test', passwordHash, displayUnit: 'LB' })
    expect(user.displayUnit).toBe('LB')
  })

  it('stamps its own creation time', () => {
    const before = Date.now()
    const user = User.create({ email: 'ian@example.test', passwordHash })

    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('accepts an explicit creation time, so an import can preserve history', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z')
    const user = User.create({ email: 'ian@example.test', passwordHash, createdAt })

    expect(user.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })
})

describe('a registered user', () => {
  const user = User.create({ email: 'ian@example.test', passwordHash })

  it('cannot be mutated from outside', () => {
    expect(() => {
      ;(user as unknown as { id: string }).id = 'tampered'
    }).toThrow()
  })

  it('changes its display unit by returning a new instance', () => {
    const inPounds = user.preferring('LB')

    expect(inPounds.displayUnit).toBe('LB')
    expect(user.displayUnit).toBe('KG')
    expect(inPounds.equals(user)).toBe(true)
  })

  it('replaces its password hash by returning a new instance', () => {
    const rotated = user.withPasswordHash(PasswordHash.create('argon2id$new'))

    expect(rotated.passwordHash.value).toBe('argon2id$new')
    expect(user.passwordHash.value).toBe('argon2id$hash')
  })

  it('is identified by id, not by email', () => {
    const restored = User.restore({
      id: user.id,
      email: user.email,
      passwordHash,
      displayUnit: 'KG',
      createdAt: user.createdAt,
    })

    expect(user.equals(restored)).toBe(true)
  })
})
