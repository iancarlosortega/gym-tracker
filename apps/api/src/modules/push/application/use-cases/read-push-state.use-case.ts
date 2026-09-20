import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { PUSH_SUBSCRIPTION_REPOSITORY } from '@api/modules/push/push.tokens.js'
import type { PushSubscriptionRepository } from '@gym/domain/push/ports/push-subscription.repository'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface PushState {
  /** Null when the server has no VAPID keys, so the client cannot subscribe. */
  readonly publicKey: string | null
  readonly subscribed: boolean
  /** True when every device this user registered has since been retired. */
  readonly invalidated: boolean
}

/**
 * What the client needs to decide whether to promise pocketed alerts.
 *
 * The public key is served rather than built into the bundle: it belongs to
 * the deployment, and a key baked in at build time would mean rebuilding the
 * app to rotate it.
 *
 * `invalidated` is the disclosure the spec asks for. A user whose only device
 * was retired by its push service has subscriptions on file and no working
 * one, which is indistinguishable from "it works" unless we say so.
 */
@Injectable()
export class ReadPushStateUseCase {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: PushSubscriptionRepository,
    @Inject(ConfigService) private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async execute(userId: string): Promise<PushState> {
    const valid = await this.subscriptions.findValidForUser(userId)
    const everRegistered = await this.subscriptions.countForUser(userId)

    return {
      publicKey: this.config.get('VAPID_PUBLIC_KEY', { infer: true }) ?? null,
      subscribed: valid.length > 0,
      invalidated: valid.length === 0 && everRegistered > 0,
    }
  }
}
