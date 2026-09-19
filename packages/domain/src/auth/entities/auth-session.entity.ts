import { SessionExpiredError } from '@domain/auth/errors.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

const MILLISECONDS_PER_DAY = 86_400_000

export interface CreateSessionInput {
  readonly userId: Id
  readonly lifetimeDays: number
  /**
   * Required, unlike a creation stamp elsewhere: expiry is behaviour, and a
   * test that cannot choose "now" cannot assert when a session lapses.
   */
  readonly now: Date
}

export interface StoredSessionProps {
  readonly id: Id
  readonly userId: Id
  readonly issuedAt: Date
  readonly expiresAt: Date
}

/**
 * A server-held authentication session.
 *
 * The cookie carries only this id. The credential therefore lives outside
 * script-writable storage, which matters on iOS: Safari may evict what page
 * scripts write, and an evicted token would sign the user out after a fortnight
 * of not training.
 */
export class AuthSession {
  private constructor(private readonly props: StoredSessionProps) {
    Object.freeze(this)
  }

  static create(input: CreateSessionInput): AuthSession {
    return new AuthSession({
      id: Id.create(),
      userId: input.userId,
      issuedAt: new Date(input.now),
      expiresAt: new Date(input.now.getTime() + input.lifetimeDays * MILLISECONDS_PER_DAY),
    })
  }

  static restore(props: StoredSessionProps): AuthSession {
    return new AuthSession({
      ...props,
      issuedAt: new Date(props.issuedAt),
      expiresAt: new Date(props.expiresAt),
    })
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get issuedAt(): Date {
    return new Date(this.props.issuedAt)
  }

  get expiresAt(): Date {
    return new Date(this.props.expiresAt)
  }

  isExpiredAt(instant: Date): boolean {
    return instant.getTime() >= this.props.expiresAt.getTime()
  }

  /** Slide the expiry forward, producing a new session rather than mutating this one. */
  renewedAt(instant: Date, lifetimeDays: number): AuthSession {
    if (this.isExpiredAt(instant)) {
      throw new SessionExpiredError('An expired session cannot be renewed; sign in again.')
    }
    return new AuthSession({
      ...this.props,
      expiresAt: new Date(instant.getTime() + lifetimeDays * MILLISECONDS_PER_DAY),
    })
  }

  equals(other: AuthSession): boolean {
    return this.props.id.equals(other.id)
  }

  toJSON(): StoredSessionProps {
    return { ...this.props }
  }
}
