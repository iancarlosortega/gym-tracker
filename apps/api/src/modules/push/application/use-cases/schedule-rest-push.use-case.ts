import { CLOCK, PUSH_SCHEDULER } from '@api/modules/push/push.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ScheduleRestPushInput {
  readonly userId: string
  readonly setId: string
  readonly fireAt: Date
}

/**
 * Book the buzz that ends a rest.
 *
 * Scheduling by set rather than by rest interval is what makes cancelling
 * possible: the client already knows the id of the set it just logged, and
 * that id is the only thing both sides agree on.
 *
 * Any alert already booked for this set is dropped first, so adjusting a rest
 * replaces its alert instead of adding a second one.
 */
@Injectable()
export class ScheduleRestPushUseCase {
  constructor(
    @Inject(PUSH_SCHEDULER) private readonly scheduler: PushScheduler,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: ScheduleRestPushInput): Promise<ScheduledPush> {
    await this.scheduler.cancelForSet(input.setId)

    const push = ScheduledPush.schedule({
      userId: Id.restore(input.userId),
      setId: Id.restore(input.setId),
      fireAt: input.fireAt,
      now: this.clock.now(),
    })

    await this.scheduler.schedule(push)
    return push
  }
}
