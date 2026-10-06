import {
  type IssuedSession,
  SessionIssuer,
} from '@api/modules/auth/application/services/session-issuer.service.js'
import { PASSWORD_HASHER, USER_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import { Email } from '@gym/domain/auth/value-objects/email.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface SignInInput {
  readonly email: string
  readonly password: string
}

export type SignInResult = IssuedSession

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly issuer: SessionIssuer,
  ) {}

  /**
   * Every failure path throws the same error with the same message.
   *
   * An unknown address, a wrong password and a malformed address are
   * indistinguishable to the caller on purpose: anything else lets someone
   * discover which addresses have accounts by reading the difference.
   */
  async execute(input: SignInInput): Promise<SignInResult> {
    const email = this.parseEmail(input.email)
    if (email === null) {
      throw this.failure()
    }

    const user = await this.users.findOne(
      Criteria.create<UserCriteriaFields>({ email: email.value }),
    )
    if (user === null) {
      throw this.failure()
    }

    const matches = await this.hasher.verify(input.password, user.passwordHash)
    if (!matches) {
      throw this.failure()
    }

    return this.issuer.issue(user.id)
  }

  private parseEmail(input: string): Email | null {
    try {
      return Email.create(input)
    } catch {
      return null
    }
  }

  private failure(): AuthenticationFailedError {
    return new AuthenticationFailedError('That email and password do not match an account.')
  }
}
