import { SeedAccountUseCase } from '@api/modules/auth/application/use-cases/seed-account.use-case.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { SignOutUseCase } from '@api/modules/auth/application/use-cases/sign-out.use-case.js'
import {
  FakePasswordHasher,
  FixedClock,
  InMemoryAuthSessionRepository,
  InMemoryUserRepository,
} from '@api/modules/auth/testing/in-memory-auth.js'
import { AccountAlreadyExistsError, AuthenticationFailedError } from '@gym/domain/auth/errors'
import type { UserCriteriaFields } from '@gym/domain/auth/repositories/user.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { beforeEach, describe, expect, it } from 'vitest'

const now = new Date('2026-09-19T12:00:00.000Z')

let users: InMemoryUserRepository
let sessions: InMemoryAuthSessionRepository
let clock: FixedClock
let signIn: SignInUseCase
let signOut: SignOutUseCase
let seedAccount: SeedAccountUseCase

beforeEach(async () => {
  users = new InMemoryUserRepository()
  sessions = new InMemoryAuthSessionRepository()
  clock = new FixedClock(now)

  const hasher = new FakePasswordHasher()

  seedAccount = new SeedAccountUseCase(users, hasher)
  signIn = new SignInUseCase(users, sessions, hasher, clock, { sessionLifetimeDays: 90 })
  signOut = new SignOutUseCase(sessions)

  await seedAccount.execute({ email: 'ian@example.test', password: 'correct horse battery' })
})

describe('seeding the single account', () => {
  it('creates the account with a hashed password', async () => {
    const user = await users.findOne(
      Criteria.create<UserCriteriaFields>({ email: 'ian@example.test' }),
    )

    expect(user).not.toBeNull()
    expect(user?.passwordHash.value).not.toContain('correct horse battery')
  })

  it('refuses to seed a second account, because this system has one user', async () => {
    await expect(
      seedAccount.execute({ email: 'someone@example.test', password: 'another' }),
    ).rejects.toThrow(AccountAlreadyExistsError)
  })

  it('normalises the address so a capitalised sign-in still works', async () => {
    const result = await signIn.execute({
      email: '  IAN@Example.TEST ',
      password: 'correct horse battery',
    })

    expect(result.sessionId).toBeDefined()
  })
})

describe('signing in', () => {
  it('issues a session that expires after the configured lifetime', async () => {
    const result = await signIn.execute({
      email: 'ian@example.test',
      password: 'correct horse battery',
    })

    expect(result.expiresAt.toISOString()).toBe('2026-12-18T12:00:00.000Z')
    expect(sessions.sessions.size).toBe(1)
  })

  it('refuses a wrong password', async () => {
    await expect(signIn.execute({ email: 'ian@example.test', password: 'wrong' })).rejects.toThrow(
      AuthenticationFailedError,
    )

    expect(sessions.sessions.size).toBe(0)
  })

  it('refuses an unknown address', async () => {
    await expect(
      signIn.execute({ email: 'nobody@example.test', password: 'correct horse battery' }),
    ).rejects.toThrow(AuthenticationFailedError)
  })

  it('fails identically for an unknown address and a wrong password, so accounts cannot be enumerated', async () => {
    const wrongPassword = await signIn
      .execute({ email: 'ian@example.test', password: 'wrong' })
      .catch((error: Error) => error)
    const unknownAddress = await signIn
      .execute({ email: 'nobody@example.test', password: 'correct horse battery' })
      .catch((error: Error) => error)

    expect(unknownAddress.constructor).toBe(wrongPassword.constructor)
    expect(unknownAddress.message).toBe(wrongPassword.message)
  })

  it('refuses a malformed address without leaking that it was malformed', async () => {
    await expect(signIn.execute({ email: 'not-an-email', password: 'x' })).rejects.toThrow(
      AuthenticationFailedError,
    )
  })
})

describe('signing out', () => {
  it('removes the session so it can no longer be used', async () => {
    const { sessionId } = await signIn.execute({
      email: 'ian@example.test',
      password: 'correct horse battery',
    })

    await signOut.execute({ sessionId })

    expect(sessions.sessions.size).toBe(0)
  })

  it('is silent about an unknown session, because signing out twice is not an error', async () => {
    await expect(signOut.execute({ sessionId: 'never-existed' })).resolves.toBeUndefined()
  })
})
