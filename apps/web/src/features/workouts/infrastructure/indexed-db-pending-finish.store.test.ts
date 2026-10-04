import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { PENDING_SETS_STORE } from '../../shared/infrastructure/gym-database.ts'
import { IndexedDbPendingFinishStore } from './indexed-db-pending-finish.store.ts'

const sessionId = '0199a1f0-0000-7000-8000-0000000000a1'
const finishedAt = new Date('2026-10-04T10:30:00.000Z')

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

describe('IndexedDbPendingFinishStore', () => {
  it('keeps a finish until it is delivered', async () => {
    const store = new IndexedDbPendingFinishStore()

    await store.put({ sessionId, finishedAt })

    expect(await store.all()).toEqual([{ sessionId, finishedAt }])
  })

  it('forgets a finish once it is delivered', async () => {
    const store = new IndexedDbPendingFinishStore()
    await store.put({ sessionId, finishedAt })

    await store.delete(sessionId)

    expect(await store.all()).toEqual([])
  })

  it('keeps the sets an older version of the app queued when it upgrades', async () => {
    // What a phone that logged sets before this release has on disk: version 1,
    // with only the set queue.
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open('gym-tracker', 1)
      opening.onupgradeneeded = () => {
        opening.result
          .createObjectStore(PENDING_SETS_STORE, { keyPath: 'id' })
          .put({ id: 'queued-before-upgrade' })
      }
      opening.onsuccess = () => {
        opening.result.close()
        resolve()
      }
      opening.onerror = () => reject(opening.error)
    })

    await new IndexedDbPendingFinishStore().put({ sessionId, finishedAt })

    const survivors = await new Promise<unknown[]>((resolve, reject) => {
      const opening = indexedDB.open('gym-tracker')
      opening.onsuccess = () => {
        const all = opening.result
          .transaction(PENDING_SETS_STORE, 'readonly')
          .objectStore(PENDING_SETS_STORE)
          .getAll()
        all.onsuccess = () => {
          opening.result.close()
          resolve(all.result)
        }
      }
      opening.onerror = () => reject(opening.error)
    })
    expect(survivors).toEqual([{ id: 'queued-before-upgrade' }])
  })
})
