/**
 * The phone's one IndexedDB database, shared by every offline store.
 *
 * One opener so the version and the upgrade live in one place: two stores
 * opening the same database at different versions would block each other,
 * and an upgrade written twice is an upgrade that drifts.
 */
export const GYM_DATABASE = 'gym-tracker'
export const PENDING_SETS_STORE = 'pending-sets'
export const PENDING_FINISH_STORE = 'pending-finish'

/** Version 2 added the finish queue. Upgrades only ever add stores. */
const VERSION = 2

export const openGymDatabase = async (name: string = GYM_DATABASE): Promise<IDBDatabase> => {
  const opening = indexedDB.open(name, VERSION)

  opening.onupgradeneeded = () => {
    const database = opening.result

    if (!database.objectStoreNames.contains(PENDING_SETS_STORE)) {
      database.createObjectStore(PENDING_SETS_STORE, { keyPath: 'id' })
    }
    if (!database.objectStoreNames.contains(PENDING_FINISH_STORE)) {
      database.createObjectStore(PENDING_FINISH_STORE, { keyPath: 'sessionId' })
    }
  }

  return await request<IDBDatabase>(opening)
}

export function request<TResult>(pending: IDBRequest): Promise<TResult> {
  return new Promise((resolve, reject) => {
    pending.onsuccess = () => resolve(pending.result as TResult)
    pending.onerror = () => reject(pending.error)
  })
}

export function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
