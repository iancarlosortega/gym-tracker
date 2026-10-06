import { RegisterAccountUseCase } from '@api/modules/auth/application/use-cases/register-account.use-case.js'
import {
  FakePasswordHasher,
  InMemoryUserRepository,
} from '@api/modules/auth/testing/in-memory-auth.js'
import {
  EmailAlreadyRegisteredError,
  InvalidEmailError,
  WeakPasswordError,
} from '@gym/domain/auth/errors'
import type { UserCriteriaFields } from '@gym/domain/auth/repositories/user.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { beforeEach, describe, expect, it } from 'vitest'

let users: InMemoryUserRepository
let register: RegisterAccountUseCase

beforeEach(() => {
  users = new InMemoryUserRepository()
  register = new RegisterAccountUseCase(users, new FakePasswordHasher())
})

const accounts = () => users.count(Criteria.none<UserCriteriaFields>())

describe('registering an account', () => {
  it('creates the account with a normalised address and a hashed password', async () => {
    const user = await register.execute({
      email: ' New@Example.TEST ',
      password: 'correct horse battery',
    })

    expect(user.email.value).toBe('new@example.test')
    expect(user.passwordHash.value).not.toContain('correct horse battery')
    expect(await accounts()).toBe(1)
  })

  it('lets a second person register, because accounts are per email rather than one per system', async () => {
    await register.execute({ email: 'ian@example.test', password: 'correct horse battery' })
    await register.execute({ email: 'ana@example.test', password: 'another long one' })

    expect(await accounts()).toBe(2)
  })

  it('refuses an address that already has an account, whatever its case or spacing', async () => {
    await register.execute({ email: 'ian@example.test', password: 'correct horse battery' })

    await expect(
      register.execute({ email: '  IAN@Example.test ', password: 'a different one' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError)
    expect(await accounts()).toBe(1)
  })

  it('refuses an unusable address', async () => {
    await expect(
      register.execute({ email: 'not-an-email', password: 'correct horse battery' }),
    ).rejects.toThrow(InvalidEmailError)
    expect(await accounts()).toBe(0)
  })

  it('refuses a password the policy does not allow', async () => {
    await expect(
      register.execute({ email: 'new@example.test', password: 'short' }),
    ).rejects.toThrow(WeakPasswordError)
    expect(await accounts()).toBe(0)
  })

  it('checks the address before the password, so a typo in the email is reported first', async () => {
    await expect(register.execute({ email: 'nope', password: 'short' })).rejects.toThrow(
      InvalidEmailError,
    )
  })
})
