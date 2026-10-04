import {
  completed,
  openGymDatabase,
  PENDING_FINISH_STORE,
  request,
} from '../../shared/infrastructure/gym-database'
import type { PendingFinish, PendingFinishStore } from '../application/pending-finish.store'

interface PendingFinishRecord {
  readonly sessionId: string
  readonly finishedAt: string
}

/** Finishes waiting for a network, beside the sets that have to reach the server first. */
export class IndexedDbPendingFinishStore implements PendingFinishStore {
  async put(finish: PendingFinish): Promise<void> {
    await this.write((store) => {
      store.put({ sessionId: finish.sessionId, finishedAt: finish.finishedAt.toISOString() })
    })
  }

  async all(): Promise<readonly PendingFinish[]> {
    const database = await openGymDatabase()

    try {
      const store = database
        .transaction(PENDING_FINISH_STORE, 'readonly')
        .objectStore(PENDING_FINISH_STORE)
      const records = await request<PendingFinishRecord[]>(store.getAll())

      return records.map((record) => ({
        sessionId: record.sessionId,
        finishedAt: new Date(record.finishedAt),
      }))
    } finally {
      database.close()
    }
  }

  async delete(sessionId: string): Promise<void> {
    await this.write((store) => {
      store.delete(sessionId)
    })
  }

  private async write(work: (store: IDBObjectStore) => void): Promise<void> {
    const database = await openGymDatabase()

    try {
      const transaction = database.transaction(PENDING_FINISH_STORE, 'readwrite')
      work(transaction.objectStore(PENDING_FINISH_STORE))
      await completed(transaction)
    } finally {
      database.close()
    }
  }
}
