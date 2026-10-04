import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { PendingFinishStore } from './pending-finish.store'

/**
 * Finish a workout the same way a set is logged: on the phone first.
 *
 * The instant is taken now, when the user pressed finish, because the
 * server will not hear about it until there is a network — and the end of a
 * workout is when the lifter stopped, not when the basement let them send it.
 */
export class FinishWorkoutOfflineUseCase {
  constructor(
    private readonly finishes: PendingFinishStore,
    private readonly clock: Pick<Clock, 'now'>,
  ) {}

  async execute(sessionId: string): Promise<void> {
    await this.finishes.put({ sessionId, finishedAt: this.clock.now() })
  }
}
