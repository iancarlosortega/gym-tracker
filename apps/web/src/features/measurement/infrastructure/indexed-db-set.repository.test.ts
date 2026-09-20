import { describeSetRepositoryContract } from '@gym/domain/measurement/repositories/set.repository.contract'
import { IDBFactory } from 'fake-indexeddb'
import { IndexedDbSetRepository } from './indexed-db-set.repository.ts'

/**
 * The offline queue is held to the same contract as Postgres.
 *
 * A fresh factory per case rather than a fresh database name: it clears
 * every store the adapter may have opened, so no test can inherit another's
 * queue.
 */
describeSetRepositoryContract({
  name: 'IndexedDbSetRepository',
  async create() {
    globalThis.indexedDB = new IDBFactory()

    return {
      repository: new IndexedDbSetRepository(),
      references: {
        sessionId: '0199a1f0-0000-7000-8000-0000000000a1',
        exerciseId: '0199a1f0-0000-7000-8000-0000000000a2',
        barbellId: '0199a1f0-0000-7000-8000-0000000000a3',
        machineId: '0199a1f0-0000-7000-8000-0000000000a4',
      },
    }
  },
})
