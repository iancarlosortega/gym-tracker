import type { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import type { User } from '@gym/domain/auth/entities/user.entity'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import type {
  AuthSessionCriteria,
  AuthSessionRepository,
} from '@gym/domain/auth/repositories/auth-session.repository'
import type { UserCriteria, UserRepository } from '@gym/domain/auth/repositories/user.repository'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>()

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user)
  }

  async findOne(criteria: UserCriteria): Promise<User | null> {
    for (const user of this.users.values()) {
      const id = criteria.get('id')
      const email = criteria.get('email')
      if (id !== undefined && user.id.value !== id) {
        continue
      }
      if (email !== undefined && user.email.value !== email) {
        continue
      }
      return user
    }
    return null
  }

  async count(criteria: UserCriteria): Promise<number> {
    return criteria.isEmpty() ? this.users.size : (await this.findOne(criteria)) === null ? 0 : 1
  }
}

export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  readonly sessions = new Map<string, AuthSession>()

  async save(session: AuthSession): Promise<void> {
    this.sessions.set(session.id.value, session)
  }

  async findOne(criteria: AuthSessionCriteria): Promise<AuthSession | null> {
    for (const session of this.sessions.values()) {
      const id = criteria.get('id')
      const userId = criteria.get('userId')
      if (id !== undefined && session.id.value !== id) {
        continue
      }
      if (userId !== undefined && session.userId.value !== userId) {
        continue
      }
      return session
    }
    return null
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id)
  }

  async deleteAllFor(userId: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.userId.value === userId) {
        this.sessions.delete(id)
      }
    }
  }
}

/**
 * A deterministic stand-in for argon2.
 *
 * Not cryptography, but deliberately not reversible either: a fake that
 * embedded the plaintext would quietly defeat the test asserting that a stored
 * credential never contains the password.
 */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<PasswordHash> {
    return PasswordHash.create(`fake$${FakePasswordHasher.digest(plaintext)}`)
  }

  async verify(plaintext: string, hash: PasswordHash): Promise<boolean> {
    return hash.value === `fake$${FakePasswordHasher.digest(plaintext)}`
  }

  private static digest(input: string): string {
    let accumulator = 2_166_136_261
    for (let index = 0; index < input.length; index += 1) {
      accumulator ^= input.charCodeAt(index)
      accumulator = Math.imul(accumulator, 16_777_619)
    }
    return (accumulator >>> 0).toString(16).padStart(8, '0')
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current)
  }

  advanceTo(instant: Date): void {
    this.current = instant
  }
}
