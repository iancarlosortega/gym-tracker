import { PUSH_SUBSCRIPTION_REPOSITORY } from '@api/modules/push/push.tokens.js'
import { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import type { PushSubscriptionRepository } from '@gym/domain/push/ports/push-subscription.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface RegisterPushSubscriptionInput {
  readonly userId: string
  readonly endpoint: string
  readonly p256dh: string
  readonly auth: string
}

/**
 * Remember a device that has agreed to be buzzed.
 *
 * Re-registering the same endpoint revives it rather than adding a row. A
 * browser hands back the same endpoint when permission is granted again, and
 * that is exactly the moment a user who was told their alerts had stopped is
 * fixing them — so the invalid flag has to clear.
 */
@Injectable()
export class RegisterPushSubscriptionUseCase {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: PushSubscriptionRepository,
  ) {}

  async execute(input: RegisterPushSubscriptionInput): Promise<PushSubscription> {
    const subscription = PushSubscription.create({
      userId: Id.restore(input.userId),
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    })

    await this.subscriptions.save(subscription)
    return subscription
  }
}
