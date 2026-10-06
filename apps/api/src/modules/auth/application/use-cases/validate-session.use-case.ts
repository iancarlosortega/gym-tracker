import type { SessionPolicy } from '@api/modules/auth/application/services/session-issuer.service.js'
import {
  CLOCK,
  SESSION_POLICY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@api/modules/auth/auth.tokens.js'
import type { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import type { User } from '@gym/domain/auth/entities/user.entity'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type {
  AuthSessionCriteriaFields,
  AuthSessionRepository,
} from '@gym/domain/auth/repositories/auth-session.repository'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface AuthenticatedCaller {
  readonly user: User
  readonly session: AuthSession
  /** Set when the session slid forward and the cookie should be refreshed. */
  readonly renewed: boolean
}

@Injectable()
export class ValidateSessionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SESSION_POLICY) private readonly policy: SessionPolicy,
  ) {}

  /**
   * Resolve a session id into the caller it represents, or null.
   *
   * An expired session is deleted on the way out rather than merely refused:
   * leaving it in place would accumulate rows that can never authenticate
   * anything again.
   *
   * A live session slides its expiry forward once it is past the halfway mark,
   * so someone who trains regularly is never signed out, while a session that
   * is genuinely abandoned still lapses.
   */
  async execute(sessionId: string): Promise<AuthenticatedCaller | null> {
    const session = await this.sessions.findOne(
      Criteria.create<AuthSessionCriteriaFields>({ id: sessionId }),
    )
    if (session === null) {
      return null
    }

    const now = this.clock.now()
    if (session.isExpiredAt(now)) {
      await this.sessions.delete(session.id.value)
      return null
    }

    const user = await this.users.findOne(
      Criteria.create<UserCriteriaFields>({ id: session.userId.value }),
    )
    if (user === null) {
      // The account is gone but the session outlived it; clean up and refuse.
      await this.sessions.delete(session.id.value)
      return null
    }

    if (!this.shouldRenew(session, now)) {
      return { user, session, renewed: false }
    }

    const renewed = session.renewedAt(now, this.policy.sessionLifetimeDays)
    await this.sessions.save(renewed)

    return { user, session: renewed, renewed: true }
  }

  private shouldRenew(session: AuthSession, now: Date): boolean {
    const issued = session.issuedAt.getTime()
    const expires = session.expiresAt.getTime()
    return now.getTime() >= issued + (expires - issued) / 2
  }
}
