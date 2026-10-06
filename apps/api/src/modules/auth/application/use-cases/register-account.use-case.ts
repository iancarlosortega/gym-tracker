import { PASSWORD_HASHER, USER_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import { User } from '@gym/domain/auth/entities/user.entity'
import { EmailAlreadyRegisteredError } from '@gym/domain/auth/errors'
import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import { checkPasswordPolicy } from '@gym/domain/auth/services/password-policy.service'
import { Email } from '@gym/domain/auth/value-objects/email.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface RegisterAccountInput {
  readonly email: string
  readonly password: string
}

/**
 * Create an account for an address that does not have one yet.
 *
 * The one path every account comes through, whether from the register page
 * or the operator's seed command, so the password policy cannot differ
 * between them.
 *
 * Unlike sign-in, a taken address is reported as taken: a person registering
 * needs to hear that they already have an account. The rate limit on the
 * route is what keeps that from becoming a fast way to probe addresses.
 */
@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterAccountInput): Promise<User> {
    const email = Email.create(input.email)
    checkPasswordPolicy(input.password)

    const existing = await this.users.findOne(
      Criteria.create<UserCriteriaFields>({ email: email.value }),
    )
    if (existing !== null) {
      throw new EmailAlreadyRegisteredError('An account with that email already exists.')
    }

    const user = User.create({
      email: email.value,
      passwordHash: await this.hasher.hash(input.password),
    })

    // Two registrations racing for one address both pass the check above;
    // the repository turns the losing insert into the same error.
    await this.users.save(user)
    return user
  }
}
