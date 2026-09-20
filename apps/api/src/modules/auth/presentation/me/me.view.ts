import type { User } from '@gym/domain/auth/entities/user.entity'

/**
 * What the signed-in user looks like over the wire.
 *
 * Never the entity itself: the password hash lives on it, and a serialiser
 * that walked the object would be one refactor away from shipping it.
 */
export interface CallerView {
  readonly id: string
  readonly email: string
  readonly displayUnit: string
}

export function toCallerView(user: User): CallerView {
  return { id: user.id.value, email: user.email.value, displayUnit: user.displayUnit }
}
