import { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import { User } from '@gym/domain/auth/entities/user.entity'
import type { AuthSessionCriteriaFields } from '@gym/domain/auth/repositories/auth-session.repository'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FixedClock,
  InMemoryAuthSessionRepository,
  InMemoryUserRepository,
} from '../../testing/in-memory-auth.ts'
import { ValidateSessionUseCase } from './validate-session.use-case.ts'

const issuedAt = new Date('2026-09-19T12:00:00.000Z')

let users: InMemoryUserRepository
let sessions: InMemoryAuthSessionRepository
let clock: FixedClock
let validate: ValidateSessionUseCase
let sessionId: string

beforeEach(async () => {
  users = new InMemoryUserRepository()
  sessions = new InMemoryAuthSessionRepository()
  clock = new FixedClock(issuedAt)
  validate = new ValidateSessionUseCase(users, sessions, clock, { sessionLifetimeDays: 90 })

  const user = User.create({
    email: 'ian@example.test',
    passwordHash: PasswordHash.create('argon2id$hash'),
  })
  await users.save(user)

  const session = AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 })
  await sessions.save(session)
  sessionId = session.id.value
})

describe('validating a session', () => {
  it('resolves a live session to its user', async () => {
    const caller = await validate.execute(sessionId)

    expect(caller?.user.email.value).toBe('ian@example.test')
  })

  it('survives a fortnight of not training without renewing early', async () => {
    clock.advanceTo(new Date('2026-10-03T12:00:00.000Z'))

    const caller = await validate.execute(sessionId)

    expect(caller).not.toBeNull()
    expect(caller?.renewed).toBe(false)
  })

  it('refuses an expired session', async () => {
    clock.advanceTo(new Date('2027-01-01T12:00:00.000Z'))

    expect(await validate.execute(sessionId)).toBeNull()
  })

  it('deletes an expired session rather than leaving a row that can never authenticate', async () => {
    clock.advanceTo(new Date('2027-01-01T12:00:00.000Z'))

    await validate.execute(sessionId)

    expect(sessions.sessions.size).toBe(0)
  })

  it('refuses an unknown session id', async () => {
    expect(await validate.execute('0199a1f0-0000-7000-8000-0000000000ff')).toBeNull()
  })

  it('slides the expiry forward once past the halfway mark', async () => {
    clock.advanceTo(new Date('2026-11-20T12:00:00.000Z'))

    const caller = await validate.execute(sessionId)

    expect(caller?.renewed).toBe(true)

    const stored = await sessions.findOne(
      Criteria.create<AuthSessionCriteriaFields>({ id: sessionId }),
    )
    expect(stored?.expiresAt.getTime()).toBeGreaterThan(
      new Date('2026-12-18T12:00:00.000Z').getTime(),
    )
  })

  it('refuses a session whose account no longer exists', async () => {
    users = new InMemoryUserRepository()
    validate = new ValidateSessionUseCase(users, sessions, clock, { sessionLifetimeDays: 90 })

    expect(await validate.execute(sessionId)).toBeNull()
    expect(sessions.sessions.size).toBe(0)
  })
})
