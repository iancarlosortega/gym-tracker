import type { PushSubscription } from '@domain/push/entities/push-subscription.entity.js'

export interface PushNotification {
  readonly title: string
  readonly body: string
}

/**
 * The result of trying to buzz one device.
 *
 * `gone` is separated from every other failure because it is the only one
 * that means something permanent: the subscription is dead and the user has
 * to be told their alerts have stopped. Everything else is worth retrying.
 */
export type PushDelivery = 'delivered' | 'gone' | 'failed'

export interface PushSender {
  send(subscription: PushSubscription, notification: PushNotification): Promise<PushDelivery>
}
