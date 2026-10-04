import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { SyncPendingSetsUseCase } from '../../measurement/application/sync-pending-sets.use-case'
import type { PendingFinishStore } from './pending-finish.store'

export type FinishOnServer = (sessionId: string, finishedAt: Date) => Promise<void>

/**
 * Everything the phone owes the server, in the order the server needs it.
 *
 * Sets first, then finishes — and a finish only once its own workout has no
 * set left in the queue. The server takes a late set as long as it was logged
 * before the finish, but holding the finish back keeps the queue honest: a
 * workout the phone calls closed has nothing left to send.
 */
export class SyncPendingWorkUseCase {
  constructor(
    private readonly syncSets: SyncPendingSetsUseCase,
    private readonly queue: SetRepository,
    private readonly finishes: PendingFinishStore,
    private readonly finishOnServer: FinishOnServer,
  ) {}

  async execute(): Promise<void> {
    await this.syncSets.execute()

    for (const finish of await this.finishes.all()) {
      const stillQueued = await this.queue.count(Criteria.create({ sessionId: finish.sessionId }))

      if (stillQueued > 0) {
        continue
      }

      try {
        await this.finishOnServer(finish.sessionId, finish.finishedAt)
        await this.finishes.delete(finish.sessionId)
      } catch {
        // Kept for the next attempt, exactly like an unsent set.
      }
    }
  }
}
