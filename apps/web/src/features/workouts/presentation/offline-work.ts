import { CountPendingSetsUseCase } from '../../measurement/application/count-pending-sets.use-case'
import { SyncPendingSetsUseCase } from '../../measurement/application/sync-pending-sets.use-case'
import { HttpSetSyncGateway } from '../../measurement/infrastructure/http-set-sync.gateway'
import { IndexedDbSetRepository } from '../../measurement/infrastructure/indexed-db-set.repository'
import { SystemClock } from '../../shared/infrastructure/system-clock.adapter'
import { FinishWorkoutOfflineUseCase } from '../application/finish-workout-offline.use-case'
import { SyncPendingWorkUseCase } from '../application/sync-pending-work.use-case'
import { IndexedDbPendingFinishStore } from '../infrastructure/indexed-db-pending-finish.store'
import { finishWorkout } from '../infrastructure/workouts.api'

const build = () => {
  const queue = new IndexedDbSetRepository()
  const finishes = new IndexedDbPendingFinishStore()

  return {
    countPendingSets: new CountPendingSetsUseCase(queue),
    finishes,
    finishOffline: new FinishWorkoutOfflineUseCase(finishes, new SystemClock()),
    sync: new SyncPendingWorkUseCase(
      new SyncPendingSetsUseCase(queue, new HttpSetSyncGateway()),
      queue,
      finishes,
      finishWorkout,
    ),
  }
}

let wiring: ReturnType<typeof build> | undefined

/** The phone's offline stores, built once and only in the browser, where IndexedDB exists. */
export const offlineWork = () => {
  wiring ??= build()
  return wiring
}
