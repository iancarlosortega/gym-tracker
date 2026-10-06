import { createTestDatabase } from '@api/database/testing/test-database.js'
import { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import { User } from '@gym/domain/auth/entities/user.entity'
import { EmailAlreadyRegisteredError } from '@gym/domain/auth/errors'
import type { AuthSessionCriteriaFields } from '@gym/domain/auth/repositories/auth-session.repository'
import type { UserCriteriaFields } from '@gym/domain/auth/repositories/user.repository'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrizzleAuthSessionRepository } from './drizzle-auth-session.repository.ts'
import { type AuthDatabase, DrizzleUserRepository } from './drizzle-user.repository.ts'

const issuedAt = new Date('2026-09-19T12:00:00.000Z')

let users: DrizzleUserRepository
let sessions: DrizzleAuthSessionRepository
let user: User

beforeEach(async () => {
  const client = await createTestDatabase()
  const database = drizzle(client) as unknown as AuthDatabase

  users = new DrizzleUserRepository(database)
  sessions = new DrizzleAuthSessionRepository(database)

  user = User.create({
    email: 'ian@example.test',
    passwordHash: PasswordHash.create('argon2id$hash'),
  })
  await users.save(user)
})

describe('the user repository', () => {
  it('round-trips a user with its value objects intact', async () => {
    const found = await users.findOne(
      Criteria.create<UserCriteriaFields>({ email: 'ian@example.test' }),
    )

    expect(found?.id.equals(user.id)).toBe(true)
    expect(found?.email.value).toBe('ian@example.test')
    expect(found?.displayUnit).toBe('KG')
  })

  it('finds by id as well as by address', async () => {
    const found = await users.findOne(Criteria.create<UserCriteriaFields>({ id: user.id.value }))
    expect(found?.email.value).toBe('ian@example.test')
  })

  it('counts the accounts that exist', async () => {
    expect(await users.count(Criteria.none<UserCriteriaFields>())).toBe(1)
  })

  it('turns a second account for the same address into the domain error, so a lost race reads as taken', async () => {
    const rival = User.create({
      email: 'ian@example.test',
      passwordHash: PasswordHash.create('argon2id$other'),
    })

    await expect(users.save(rival)).rejects.toThrow(EmailAlreadyRegisteredError)
    expect(await users.count(Criteria.none<UserCriteriaFields>())).toBe(1)
  })

  it('still updates an existing user in place', async () => {
    await users.save(user.preferring('LB'))

    const found = await users.findOne(Criteria.create<UserCriteriaFields>({ id: user.id.value }))
    expect(found?.displayUnit).toBe('LB')
  })

  it('returns null for an address with no account', async () => {
    expect(
      await users.findOne(Criteria.create<UserCriteriaFields>({ email: 'nobody@example.test' })),
    ).toBeNull()
  })
})

describe('the session repository', () => {
  it('round-trips a session with its expiry intact', async () => {
    const session = AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 })
    await sessions.save(session)

    const found = await sessions.findOne(
      Criteria.create<AuthSessionCriteriaFields>({ id: session.id.value }),
    )

    expect(found?.userId.equals(user.id)).toBe(true)
    expect(found?.expiresAt.toISOString()).toBe('2026-12-18T12:00:00.000Z')
  })

  it('persists a slid expiry rather than creating a second session', async () => {
    const session = AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 })
    await sessions.save(session)
    await sessions.save(session.renewedAt(new Date('2026-11-20T12:00:00.000Z'), 90))

    const found = await sessions.findOne(
      Criteria.create<AuthSessionCriteriaFields>({ userId: user.id.value }),
    )

    expect(found?.expiresAt.toISOString()).toBe('2027-02-18T12:00:00.000Z')
  })

  it('deletes a session so it can no longer authenticate', async () => {
    const session = AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 })
    await sessions.save(session)

    await sessions.delete(session.id.value)

    expect(
      await sessions.findOne(Criteria.create<AuthSessionCriteriaFields>({ id: session.id.value })),
    ).toBeNull()
  })

  it('removes every session for a user at once', async () => {
    await sessions.save(AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 }))
    await sessions.save(AuthSession.create({ userId: user.id, now: issuedAt, lifetimeDays: 90 }))

    await sessions.deleteAllFor(user.id.value)

    expect(
      await sessions.findOne(Criteria.create<AuthSessionCriteriaFields>({ userId: user.id.value })),
    ).toBeNull()
  })
})
