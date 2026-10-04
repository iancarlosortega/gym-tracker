import type { PushSubscriptionKeys } from '../infrastructure/browser-push.subscriber'

/** Where a minted subscription is recorded, so the server can send to it. */
export interface PushSubscriptionRegistry {
  registerSubscription(subscription: PushSubscriptionKeys): Promise<void>
}
