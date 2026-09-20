import { SESSION_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import type { AuthSessionRepository } from '@gym/domain/auth/repositories/auth-session.repository'

export interface SignOutInput {
  readonly sessionId: string
}

@Injectable()
export class SignOutUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: AuthSessionRepository) {}

  /** Signing out twice is not an error, so an unknown session is simply gone. */
  async execute(input: SignOutInput): Promise<void> {
    await this.sessions.delete(input.sessionId)
  }
}

import { Inject, Injectable } from '@nestjs/common'
