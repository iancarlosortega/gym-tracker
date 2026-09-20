import type { PushSubscription } from '@domain/push/entities/push-subscription.entity.js'

/**
 * The devices a user has asked to be buzzed on.
 *
 * Reads return only subscriptions still believed good: sending to one the
 * push service has already rejected wastes a request and tells us nothing we
 * do not know.
 */
export interface PushSubscriptionRepository {
  save(subscription: PushSubscription): Promise<void>
  findValidForUser(userId: string): Promise<readonly PushSubscription[]>
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>

  /**
   * Every subscription on file, valid or not.
   *
   * Only the disclosure needs this: a user with subscriptions and none of
   * them working is the case the spec says must be reported, and it is
   * indistinguishable from never having subscribed without this count.
   */
  countForUser(userId: string): Promise<number>
}
