import {
  LoggedSet,
  type StoredLoggedSetProps,
} from '@gym/domain/measurement/entities/logged-set.entity'
import type {
  SetCriteria,
  SetQueryOptions,
  SetRepository,
} from '@gym/domain/measurement/repositories/set.repository'
import { grams } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

export const PENDING_SETS_STORE = 'pending-sets'

const DATABASE_NAME = 'gym-tracker'
const DATABASE_VERSION = 1

/** The shape a set takes in the store: plain data, no class instances. */
interface PendingSetRecord {
  readonly id: string
  readonly sessionId: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly mode: string
  readonly rawValue: number
  readonly reps: number
  readonly loggedAt: string
  readonly snapshotBarGrams: number | null
  readonly snapshotDisplayUnit: string
  readonly revision: number
}

/**
 * The offline write-ahead queue, behind the same port as the database.
 *
 * It holds pending writes only — never history. History is read from the
 * server and cached separately, because the browser's storage is capped and
 * evictable, and the one thing that must never be evicted is the set nobody
 * has received yet.
 *
 * Nothing here knows about synchronisation. Draining the queue is "read every
 * pending set, write them into the API repository, delete what was confirmed",
 * and that belongs to the use case that does it, not to storage.
 */
export class IndexedDbSetRepository implements SetRepository {
  constructor(private readonly databaseName: string = DATABASE_NAME) {}

  async save(set: LoggedSet): Promise<void> {
    await this.saveMany([set])
  }

  /**
   * Later revisions win, exactly as the server's upsert does.
   *
   * A queue that let a replayed older edit overwrite a newer one would send
   * the stale value on the next drain, and the correction the user made would
   * be lost on their own device before it ever reached the network. Ties are
   * broken by the moment the set was logged, so the queue and the server
   * settle a replay identically.
   */
  async saveMany(sets: readonly LoggedSet[]): Promise<void> {
    if (sets.length === 0) {
      return
    }

    await this.write(async (store) => {
      for (const set of sets) {
        const existing = await request<PendingSetRecord | undefined>(store.get(set.id))

        if (existing === undefined || wins(set, existing)) {
          store.put(toRecord(set))
        }
      }
    })
  }

  async findOne(criteria: SetCriteria): Promise<LoggedSet | null> {
    return (await this.matching(criteria))[0] ?? null
  }

  async findMany(
    criteria: SetCriteria,
    pagination: Pagination,
    options?: SetQueryOptions,
  ): Promise<Page<LoggedSet>> {
    const found = await this.matching(criteria)

    if (options?.orderBy === 'loggedAt') {
      const direction = options.direction === 'desc' ? -1 : 1
      found.sort((left, right) => direction * (left.loggedAt.getTime() - right.loggedAt.getTime()))
    }

    return Page.create(
      found.slice(pagination.offset, pagination.offset + pagination.limit),
      found.length,
      pagination,
    )
  }

  async count(criteria: SetCriteria): Promise<number> {
    return (await this.matching(criteria)).length
  }

  /**
   * Removal, not a tombstone.
   *
   * The server tombstones so a replayed create cannot resurrect a deleted
   * set; the queue has nothing to resurrect, because a set it has dropped is
   * one it will never send again.
   */
  async delete(id: string): Promise<void> {
    await this.write(async (store) => {
      store.delete(id)
    })
  }

  private async matching(criteria: SetCriteria): Promise<LoggedSet[]> {
    const records = await this.read()

    return records
      .filter((record) => {
        const id = criteria.get('id')
        const ids = criteria.get('ids')
        const sessionId = criteria.get('sessionId')
        const exerciseId = criteria.get('exerciseId')
        const mode = criteria.get('mode')
        const loggedBetween = criteria.get('loggedBetween')

        if (id !== undefined && record.id !== id) return false
        if (ids !== undefined && !ids.includes(record.id)) return false
        if (sessionId !== undefined && record.sessionId !== sessionId) return false
        if (exerciseId !== undefined && record.exerciseId !== exerciseId) return false
        if (mode !== undefined && record.mode !== mode) return false
        if (loggedBetween !== undefined && !loggedBetween.contains(new Date(record.loggedAt))) {
          return false
        }
        return true
      })
      .map(toDomain)
  }

  private async read(): Promise<PendingSetRecord[]> {
    const database = await this.open()

    try {
      const store = database
        .transaction(PENDING_SETS_STORE, 'readonly')
        .objectStore(PENDING_SETS_STORE)

      return await request<PendingSetRecord[]>(store.getAll())
    } finally {
      database.close()
    }
  }

  private async write(work: (store: IDBObjectStore) => Promise<void>): Promise<void> {
    const database = await this.open()

    try {
      const transaction = database.transaction(PENDING_SETS_STORE, 'readwrite')
      await work(transaction.objectStore(PENDING_SETS_STORE))
      await completed(transaction)
    } finally {
      database.close()
    }
  }

  private async open(): Promise<IDBDatabase> {
    const opening = indexedDB.open(this.databaseName, DATABASE_VERSION)

    opening.onupgradeneeded = () => {
      const database = opening.result

      if (!database.objectStoreNames.contains(PENDING_SETS_STORE)) {
        database.createObjectStore(PENDING_SETS_STORE, { keyPath: 'id' })
      }
    }

    return await request<IDBDatabase>(opening)
  }
}

/**
 * Last write wins by (revision, loggedAt), matching the server's upsert.
 *
 * The tuple rather than the revision alone so that two deliveries of the same
 * set settle the same way whichever order they arrive in.
 */
function wins(candidate: LoggedSet, existing: PendingSetRecord): boolean {
  if (candidate.revision !== existing.revision) {
    return candidate.revision > existing.revision
  }
  return candidate.loggedAt.getTime() >= new Date(existing.loggedAt).getTime()
}

function request<TResult>(pending: IDBRequest): Promise<TResult> {
  return new Promise((resolve, reject) => {
    pending.onsuccess = () => resolve(pending.result as TResult)
    pending.onerror = () => reject(pending.error)
  })
}

function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function toRecord(set: LoggedSet): PendingSetRecord {
  const state = set.entry.toJSON()

  return {
    id: set.id,
    sessionId: set.sessionId,
    exerciseId: set.exerciseId,
    equipmentId: set.equipmentId,
    mode: state.mode,
    rawValue: rawValueOf(state),
    reps: set.reps,
    loggedAt: set.loggedAt.toISOString(),
    snapshotBarGrams: set.snapshot.barGrams,
    snapshotDisplayUnit: set.snapshot.displayUnit,
    revision: set.revision,
  }
}

function toDomain(record: PendingSetRecord): LoggedSet {
  const props: StoredLoggedSetProps = {
    id: record.id,
    sessionId: record.sessionId,
    exerciseId: record.exerciseId,
    equipmentId: record.equipmentId,
    entry: entryFromRecord(record),
    reps: reps(record.reps),
    loggedAt: new Date(record.loggedAt),
    snapshot: {
      barGrams: record.snapshotBarGrams === null ? null : grams(record.snapshotBarGrams),
      displayUnit: record.snapshotDisplayUnit === 'LB' ? 'LB' : 'KG',
      equipmentId: record.equipmentId,
    },
    revision: record.revision,
  }

  return LoggedSet.restore(props)
}

function rawValueOf(state: ReturnType<LoadEntry['toJSON']>): number {
  switch (state.mode) {
    case 'TOTAL':
      return state.grams
    case 'PER_SIDE':
      return state.perSideGrams
    case 'STACK_POSITION':
      return state.position
  }
}

function entryFromRecord(record: PendingSetRecord): LoadEntry {
  switch (record.mode) {
    case 'PER_SIDE':
      return LoadEntry.perSide(grams(record.rawValue), grams(record.snapshotBarGrams ?? 0))
    case 'STACK_POSITION':
      return LoadEntry.stack(stackPosition(record.rawValue))
    default:
      return LoadEntry.total(grams(record.rawValue))
  }
}
