import type { PushSubscriber } from '../infrastructure/browser-push.subscriber'
import type { PushSubscriptionRegistry } from './push-subscription.port'

/**
 * Turn on alerts that arrive with the phone in a pocket.
 *
 * Permission is requested, then the browser mints a subscription, then the
 * server is told about it. The order is forced: a subscription cannot be
 * created before permission is granted, and a subscription the server never
 * heard about is one nobody will ever send to.
 */
export class EnablePocketedAlertsUseCase {
  constructor(
    private readonly subscriber: PushSubscriber,
    private readonly registry: PushSubscriptionRegistry,
  ) {}

  /** False when the user refused; anything else throws. */
  async execute(publicKey: string): Promise<boolean> {
    if ((await this.subscriber.requestPermission()) !== 'granted') {
      return false
    }

    const subscription = await this.subscriber.subscribe(publicKey)
    await this.registry.registerSubscription(subscription)

    return true
  }
}
