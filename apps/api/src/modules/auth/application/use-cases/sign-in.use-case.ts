import {
  CLOCK,
  PASSWORD_HASHER,
  SESSION_POLICY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@api/modules/auth/auth.tokens.js'
import { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import type { AuthSessionRepository } from '@gym/domain/auth/repositories/auth-session.repository'
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

export interface SignInResult {
  readonly sessionId: string
  readonly expiresAt: Date
}

export interface SessionPolicy {
  readonly sessionLifetimeDays: number
}

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SESSION_POLICY) private readonly policy: SessionPolicy,
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

    const session = AuthSession.create({
      userId: user.id,
      now: this.clock.now(),
      lifetimeDays: this.policy.sessionLifetimeDays,
    })

    await this.sessions.save(session)

    return { sessionId: session.id.value, expiresAt: session.expiresAt }
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
