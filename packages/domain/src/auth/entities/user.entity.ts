import { Email } from '@domain/auth/value-objects/email.vo.js'
import type { PasswordHash } from '@domain/auth/value-objects/password-hash.vo.js'
import type { DisplayUnit } from '@domain/measurement/value-objects/grams.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

/**
 * What a caller knows when creating a user: an address as the person typed it, and
 * a hash produced behind the PasswordHasher port.
 *
 * The password hash stays a value object rather than a string on purpose. It is
 * the one parameter where a bare `string` would let a plaintext password be
 * passed by mistake and stored unhashed, and the type is what stops that.
 */
export interface CreateUserInput {
  readonly email: string
  readonly passwordHash: PasswordHash
  readonly displayUnit?: DisplayUnit
  readonly createdAt?: Date
}

export interface UserProps {
  readonly id: Id
  readonly email: Email
  readonly passwordHash: PasswordHash
  readonly displayUnit: DisplayUnit
  readonly createdAt: Date
}

/** The single account that owns every routine, session and set in the system. */
export class User {
  private constructor(private readonly props: UserProps) {
    Object.freeze(this)
  }

  /**
   * Create a user from primitives.
   *
   * Identity, address normalisation, the default display unit and the creation
   * stamp all belong to bringing a user into existence, so the entity performs
   * them rather than making every caller assemble them identically.
   *
   * Named `create` rather than `register` deliberately: registering is a
   * business process that may later send a verification email, seed defaults
   * and publish an event. That belongs to a use case. This makes the object.
   */
  static create(input: CreateUserInput): User {
    return new User({
      id: Id.create(),
      email: Email.create(input.email),
      passwordHash: input.passwordHash,
      displayUnit: input.displayUnit ?? 'KG',
      createdAt: new Date(input.createdAt ?? Date.now()),
    })
  }

  static restore(props: UserProps): User {
    return new User({ ...props, createdAt: new Date(props.createdAt) })
  }

  get id(): Id {
    return this.props.id
  }

  get email(): Email {
    return this.props.email
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash
  }

  get displayUnit(): DisplayUnit {
    return this.props.displayUnit
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  preferring(displayUnit: DisplayUnit): User {
    return new User({ ...this.props, displayUnit })
  }

  withPasswordHash(passwordHash: PasswordHash): User {
    return new User({ ...this.props, passwordHash })
  }

  equals(other: User): boolean {
    return this.props.id.equals(other.id)
  }
}
