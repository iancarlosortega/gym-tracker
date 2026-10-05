import { User } from '@gym/domain/auth/entities/user.entity'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import type { UserCriteriaFields } from '@gym/domain/auth/repositories/user.repository'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryUserRepository } from '../../testing/in-memory-auth.ts'
import { ChangeDisplayUnitUseCase } from './change-display-unit.use-case.ts'

let users: InMemoryUserRepository
let change: ChangeDisplayUnitUseCase
let user: User

beforeEach(async () => {
  users = new InMemoryUserRepository()
  change = new ChangeDisplayUnitUseCase(users)
  user = User.create({
    email: 'ian@example.com',
    passwordHash: PasswordHash.create('$argon2id$v=19$m=1,t=1,p=1$c2FsdA$aGFzaA'),
    displayUnit: 'KG',
  })
  await users.save(user)
})

describe('choosing pounds or kilograms', () => {
  it('remembers pounds for the user', async () => {
    const changed = await change.execute({ userId: user.id.value, displayUnit: 'LB' })

    expect(changed.displayUnit).toBe('LB')
    const stored = await users.findOne(Criteria.create<UserCriteriaFields>({ id: user.id.value }))
    expect(stored?.displayUnit).toBe('LB')
  })

  it('refuses a user that does not exist', async () => {
    await expect(
      change.execute({ userId: Id.create().value, displayUnit: 'LB' }),
    ).rejects.toBeInstanceOf(AuthenticationFailedError)
  })
})
