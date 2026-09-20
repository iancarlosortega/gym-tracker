import type { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import type { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import type { PushDelivery, PushSender } from '@gym/domain/push/ports/push-sender.port'
import type { PushSubscriptionRepository } from '@gym/domain/push/ports/push-subscription.repository'

export class InMemoryPushScheduler implements PushScheduler {
  readonly pushes = new Map<string, ScheduledPush>()

  async schedule(push: ScheduledPush): Promise<void> {
    this.pushes.set(push.id.value, push)
  }

  async cancelForSet(setId: string): Promise<void> {
    for (const [id, push] of this.pushes) {
      if (push.setId.value === setId && !push.isSent) {
        this.pushes.delete(id)
      }
    }
  }

  /** Claiming removes nothing: the row stays until it is marked sent. */
  async claimDue(instant: Date, limit: number): Promise<readonly ScheduledPush[]> {
    return [...this.pushes.values()].filter((push) => push.isDueAt(instant)).slice(0, limit)
  }

  async markSent(push: ScheduledPush): Promise<void> {
    this.pushes.set(push.id.value, push)
  }
}

export class InMemorySubscriptions implements PushSubscriptionRepository {
  readonly subscriptions = new Map<string, PushSubscription>()

  async save(subscription: PushSubscription): Promise<void> {
    this.subscriptions.set(subscription.endpoint, subscription)
  }

  async findValidForUser(userId: string): Promise<readonly PushSubscription[]> {
    return [...this.subscriptions.values()].filter(
      (subscription) => subscription.userId.value === userId && subscription.isValid,
    )
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return this.subscriptions.get(endpoint) ?? null
  }
}

/** Answers whatever it was told to, and remembers what it was asked to send. */
export class ScriptedPushSender implements PushSender {
  readonly sent: string[] = []

  constructor(private readonly answer: PushDelivery = 'delivered') {}

  async send(subscription: PushSubscription): Promise<PushDelivery> {
    this.sent.push(subscription.endpoint)
    return this.answer
  }
}
