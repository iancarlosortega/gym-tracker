import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'
import { AuthSession } from './auth-session.entity.ts'

const issuedAt = new Date('2026-09-19T12:00:00.000Z')
const userId = Id.restore('0199a1f0-0000-7000-8000-00000000c002')

const props = {
  id: Id.restore('0199a1f0-0000-7000-8000-00000000c001'),
  userId,
  issuedAt,
  expiresAt: new Date('2026-12-18T12:00:00.000Z'),
}

describe('issuing a session', () => {
  it('expires after the given lifetime', () => {
    const session = AuthSession.create({ userId, now: issuedAt, lifetimeDays: 90 })

    expect(session.expiresAt.toISOString()).toBe('2026-12-18T12:00:00.000Z')
  })

  it('generates its own identity', () => {
    const one = AuthSession.create({ userId, now: issuedAt, lifetimeDays: 90 })
    const another = AuthSession.create({ userId, now: issuedAt, lifetimeDays: 90 })

    expect(one.id.equals(another.id)).toBe(false)
  })

  it('belongs to the user it was issued for', () => {
    const session = AuthSession.create({ userId, now: issuedAt, lifetimeDays: 90 })

    expect(session.userId.equals(userId)).toBe(true)
  })
})

describe('session lifetime', () => {
  it('is live before its expiry and expired after it', () => {
    const session = AuthSession.restore(props)

    expect(session.isExpiredAt(new Date('2026-12-17T12:00:00.000Z'))).toBe(false)
    expect(session.isExpiredAt(new Date('2026-12-19T12:00:00.000Z'))).toBe(true)
  })

  it('survives a fortnight of not training, which is the point of a long lifetime', () => {
    const session = AuthSession.restore(props)

    expect(session.isExpiredAt(new Date('2026-10-03T12:00:00.000Z'))).toBe(false)
  })

  it('slides its expiry forward without mutating the original', () => {
    const session = AuthSession.restore(props)
    const renewed = session.renewedAt(new Date('2026-10-03T12:00:00.000Z'), 90)

    expect(renewed).not.toBe(session)
    expect(renewed.expiresAt.toISOString()).toBe('2027-01-01T12:00:00.000Z')
    expect(session.expiresAt.toISOString()).toBe('2026-12-18T12:00:00.000Z')
  })

  it('refuses to renew a session that has already expired', () => {
    const session = AuthSession.restore(props)

    expect(() => session.renewedAt(new Date('2027-01-01T12:00:00.000Z'), 90)).toThrow(/expired/i)
  })
})

describe('session identity', () => {
  it('is identified by id, not by the user it belongs to', () => {
    const session = AuthSession.restore(props)
    const other = AuthSession.restore({ ...props, userId: Id.create() })

    expect(session.equals(other)).toBe(true)
  })
})
