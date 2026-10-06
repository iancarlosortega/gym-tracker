import { findOwnedSet } from '@api/modules/measurement/application/use-cases/find-set.js'
import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import { PUSH_SCHEDULER } from '@api/modules/push/push.tokens.js'
import { WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface DeleteSetInput {
  readonly userId: string
  readonly setId: string
}

/**
 * Remove a set logged by mistake, in an open workout or a finished one.
 *
 * The row stays as a tombstone, so a create replayed by a phone's queue cannot
 * bring it back. A rest alert still waiting for it would buzz for a set that no
 * longer exists, so it goes too.
 */
@Injectable()
export class DeleteSetUseCase {
  constructor(
    @Inject(SET_REPOSITORY) private readonly sets: SetRepository,
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(PUSH_SCHEDULER) private readonly scheduler: PushScheduler,
  ) {}

  async execute(input: DeleteSetInput): Promise<void> {
    const set = await findOwnedSet(this.sets, this.sessions, input.userId, input.setId)

    await this.sets.delete(set.id)
    await this.scheduler.cancelForSet(set.id)
  }
}
