import { PASSWORD_HASHER, USER_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import { User } from '@gym/domain/auth/entities/user.entity'
import { AccountAlreadyExistsError } from '@gym/domain/auth/errors'
import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

export interface SeedAccountInput {
  readonly email: string
  readonly password: string
}

/**
 * Create the single account this system serves.
 *
 * Deliberately not a public registration route: there is one user, so the
 * account is seeded once by an operator command rather than exposed as an
 * endpoint anyone can reach.
 */
@Injectable()
export class SeedAccountUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: SeedAccountInput): Promise<void> {
    const existing = await this.users.count(Criteria.none<UserCriteriaFields>())
    if (existing > 0) {
      throw new AccountAlreadyExistsError('This system has one account and it already exists.')
    }

    const user = User.create({
      email: input.email,
      passwordHash: await this.hasher.hash(input.password),
    })

    await this.users.save(user)
  }
}

import { Inject, Injectable } from '@nestjs/common'
