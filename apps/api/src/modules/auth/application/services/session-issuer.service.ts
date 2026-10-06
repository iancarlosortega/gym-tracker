import { CLOCK, SESSION_POLICY, SESSION_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { AuthSessionRepository } from '@gym/domain/auth/repositories/auth-session.repository'
import type { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface SessionPolicy {
  readonly sessionLifetimeDays: number
}

export interface IssuedSession {
  readonly sessionId: string
  readonly expiresAt: Date
}

/**
 * Start a session for a user whose identity is already established.
 *
 * Signing in and signing up both end here, so a new account's first session
 * has exactly the lifetime a returning user's does.
 */
@Injectable()
export class SessionIssuer {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SESSION_POLICY) private readonly policy: SessionPolicy,
  ) {}

  async issue(userId: Id): Promise<IssuedSession> {
    const session = AuthSession.create({
      userId,
      now: this.clock.now(),
      lifetimeDays: this.policy.sessionLifetimeDays,
    })

    await this.sessions.save(session)

    return { sessionId: session.id.value, expiresAt: session.expiresAt }
  }
}
