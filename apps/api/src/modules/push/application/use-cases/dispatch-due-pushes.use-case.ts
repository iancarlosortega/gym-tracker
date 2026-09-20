import {
  CLOCK,
  PUSH_SCHEDULER,
  PUSH_SENDER,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '@api/modules/push/push.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import type { PushSender } from '@gym/domain/push/ports/push-sender.port'
import type { PushSubscriptionRepository } from '@gym/domain/push/ports/push-subscription.repository'
import { Inject, Injectable } from '@nestjs/common'

/** One second of alerts is a handful; the cap is a guard, not a throughput knob. */
const CLAIM_LIMIT = 50

export interface DispatchDuePushesResult {
  readonly sent: number
  readonly invalidated: number
}

/**
 * Send every rest alert that has come due.
 *
 * A claimed row is marked sent whatever the push service answered. A retry
 * loop here would buzz a user about a rest that ended minutes ago, which is
 * worse than silence — the rest is over either way, and the foreground timer
 * was always the guaranteed path.
 *
 * A subscription the service reports gone is invalidated rather than deleted,
 * so the next time the user opens the app it can tell them their alerts
 * stopped working instead of quietly never arriving again.
 */
@Injectable()
export class DispatchDuePushesUseCase {
  constructor(
    @Inject(PUSH_SCHEDULER) private readonly scheduler: PushScheduler,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: PushSubscriptionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(): Promise<DispatchDuePushesResult> {
    const now = this.clock.now()
    const due = await this.scheduler.claimDue(now, CLAIM_LIMIT)

    let sent = 0
    let invalidated = 0

    for (const push of due) {
      invalidated += await this.deliver(push, now)
      sent += 1
    }

    return { sent, invalidated }
  }

  private async deliver(push: ScheduledPush, now: Date): Promise<number> {
    const devices = await this.subscriptions.findValidForUser(push.userId.value)
    let invalidated = 0

    for (const device of devices) {
      const delivery = await this.sender.send(device, {
        title: 'Rest is over',
        body: 'Time for your next set.',
      })

      if (delivery === 'gone') {
        await this.subscriptions.save(device.invalidatedAt(now))
        invalidated += 1
      }
    }

    await this.scheduler.markSent(push.sentAt(now))
    return invalidated
  }
}
