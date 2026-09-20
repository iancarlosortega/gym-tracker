import { PUSH_SCHEDULER } from '@api/modules/push/push.tokens.js'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import { Inject, Injectable } from '@nestjs/common'

export interface CancelRestPushInput {
  readonly setId: string
}

/**
 * Drop the alert for a rest the user skipped.
 *
 * Silent when there is nothing booked: a client that dismisses a rest whose
 * alert already fired, or was never scheduled because notifications are off,
 * has done nothing wrong and should not be told it has.
 */
@Injectable()
export class CancelRestPushUseCase {
  constructor(@Inject(PUSH_SCHEDULER) private readonly scheduler: PushScheduler) {}

  async execute(input: CancelRestPushInput): Promise<void> {
    await this.scheduler.cancelForSet(input.setId)
  }
}
