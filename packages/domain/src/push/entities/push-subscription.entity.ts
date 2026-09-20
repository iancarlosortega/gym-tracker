import { InvalidPushSubscriptionError } from '@domain/push/errors.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export interface CreatePushSubscriptionInput {
  readonly userId: Id
  readonly endpoint: string
  readonly p256dh: string
  readonly auth: string
}

export interface PushSubscriptionProps extends CreatePushSubscriptionInput {
  readonly id: Id
  readonly invalidatedOn: Date | null
}

/**
 * One device's standing permission to be buzzed.
 *
 * The endpoint identifies it; the two keys encrypt the payload so the push
 * service relaying it cannot read what it carries. All three are opaque to us
 * and are refused only for being absent — a subscription missing a key would
 * fail at the push service with nothing useful to say.
 *
 * Invalidation is a fact the entity carries rather than a row we delete: the
 * spec requires telling the user their alerts have stopped working, and a
 * deleted row has nothing to tell them with.
 */
export class PushSubscription {
  private constructor(private readonly props: PushSubscriptionProps) {
    Object.freeze(this)
  }

  static create(input: CreatePushSubscriptionInput): PushSubscription {
    PushSubscription.assertComplete(input)

    return new PushSubscription({ ...input, id: Id.create(), invalidatedOn: null })
  }

  static restore(props: PushSubscriptionProps): PushSubscription {
    return new PushSubscription({
      ...props,
      invalidatedOn: props.invalidatedOn === null ? null : new Date(props.invalidatedOn),
    })
  }

  private static assertComplete(input: CreatePushSubscriptionInput): void {
    if (input.endpoint.trim() === '' || input.p256dh.trim() === '' || input.auth.trim() === '') {
      throw new InvalidPushSubscriptionError(
        'A push subscription needs an endpoint and both of its keys.',
      )
    }
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get endpoint(): string {
    return this.props.endpoint
  }

  get p256dh(): string {
    return this.props.p256dh
  }

  get auth(): string {
    return this.props.auth
  }

  get isValid(): boolean {
    return this.props.invalidatedOn === null
  }

  get invalidatedOn(): Date | null {
    return this.props.invalidatedOn === null ? null : new Date(this.props.invalidatedOn)
  }

  /** The push service said this endpoint is gone; stop sending to it. */
  invalidatedAt(instant: Date): PushSubscription {
    return new PushSubscription({ ...this.props, invalidatedOn: new Date(instant) })
  }
}
