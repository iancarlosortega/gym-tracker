import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetSyncGateway } from '@gym/domain/measurement/ports/set-sync.gateway'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { IndexedDbSetRepository } from '../infrastructure/indexed-db-set.repository.ts'
import { CountPendingSetsUseCase } from './count-pending-sets.use-case.ts'
import { LogSetOfflineUseCase } from './log-set-offline.use-case.ts'
import { QueueWriteFailedError } from './queue-write-failed.error.ts'
import { SyncPendingSetsUseCase } from './sync-pending-sets.use-case.ts'
import { WorkoutGoneError } from './workout-gone.error.ts'

const sessionId = '0199a1f0-0000-7000-8000-0000000000a1'
const otherSessionId = '0199a1f0-0000-7000-8000-0000000000b1'
const exerciseId = '0199a1f0-0000-7000-8000-0000000000a2'
const barbellId = '0199a1f0-0000-7000-8000-0000000000a3'

/** Accepts everything, and remembers what it was handed. */
class RecordingGateway implements SetSyncGateway {
  readonly delivered: { sessionId: string; ids: readonly string[] }[] = []

  async push(session: string, sets: readonly LoggedSet[]): Promise<readonly string[]> {
    this.delivered.push({ sessionId: session, ids: sets.map((set) => set.id) })
    return sets.map((set) => set.id)
  }
}

/** The network is down; nothing is confirmed. */
class UnreachableGateway implements SetSyncGateway {
  async push(): Promise<readonly string[]> {
    throw new Error('Failed to fetch')
  }
}

/** Takes the batch but only names some of it — a partial acceptance. */
class PartialGateway implements SetSyncGateway {
  constructor(private readonly accept: (id: string) => boolean) {}

  async push(_session: string, sets: readonly LoggedSet[]): Promise<readonly string[]> {
    return sets.map((set) => set.id).filter(this.accept)
  }
}

/** One workout was deleted elsewhere; every other one is still there. */
class GoneWorkoutGateway implements SetSyncGateway {
  readonly delivered: string[] = []

  constructor(private readonly gone: string) {}

  async push(session: string, sets: readonly LoggedSet[]): Promise<readonly string[]> {
    if (session === this.gone) throw new WorkoutGoneError(session)
    this.delivered.push(session)
    return sets.map((set) => set.id)
  }
}

let queue: IndexedDbSetRepository
let logOffline: LogSetOfflineUseCase
let countPending: CountPendingSetsUseCase

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  queue = new IndexedDbSetRepository()
  logOffline = new LogSetOfflineUseCase(queue)
  countPending = new CountPendingSetsUseCase(queue)
})

async function logSet(session = sessionId, loggedAt = new Date('2026-09-20T08:14:00.000Z')) {
  return await logOffline.execute({
    sessionId: session,
    exerciseId,
    equipmentId: barbellId,
    entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
    reps: 8,
    loggedAt,
    snapshot: { barGrams: fromKilograms(20), displayUnit: 'KG', equipmentId: barbellId },
  })
}

describe('logging while offline', () => {
  it('stores the set and resolves its mass with no network at all', async () => {
    const set = await logSet()

    expect(set.mass()).toEqual({ kind: 'resolved', grams: fromKilograms(60) })
    expect(await countPending.execute()).toBe(1)
  })

  it('survives a restart: a new adapter over the same storage still has the set', async () => {
    const set = await logSet()

    const reopened = new IndexedDbSetRepository()

    expect(await reopened.findOne(Criteria.create({ id: set.id }))).not.toBeNull()
  })

  it('raises rather than losing a set the device could not store', async () => {
    const failing = {
      save: async () => {
        throw new Error('QuotaExceededError')
      },
    } as unknown as IndexedDbSetRepository

    await expect(
      new LogSetOfflineUseCase(failing).execute({
        sessionId,
        exerciseId,
        equipmentId: barbellId,
        entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
        reps: 8,
        loggedAt: new Date('2026-09-20T08:14:00.000Z'),
        snapshot: { barGrams: fromKilograms(20), displayUnit: 'KG', equipmentId: barbellId },
      }),
    ).rejects.toThrow(QueueWriteFailedError)
  })
})

describe('draining the queue', () => {
  it('sends every pending set when connectivity returns', async () => {
    await logSet()
    await logSet()
    await logSet()
    const gateway = new RecordingGateway()

    const result = await new SyncPendingSetsUseCase(queue, gateway).execute()

    expect(result.confirmed).toBe(3)
    expect(gateway.delivered[0]?.ids).toHaveLength(3)
  })

  it('removes sets from the queue only once the server names them', async () => {
    await logSet()
    await logSet()

    await new SyncPendingSetsUseCase(queue, new RecordingGateway()).execute()

    expect(await countPending.execute()).toBe(0)
  })

  it('groups by session, because that is how the endpoint takes them', async () => {
    await logSet(sessionId)
    await logSet(otherSessionId)
    const gateway = new RecordingGateway()

    await new SyncPendingSetsUseCase(queue, gateway).execute()

    expect(gateway.delivered.map((delivery) => delivery.sessionId).sort()).toEqual(
      [otherSessionId, sessionId].sort(),
    )
  })

  it('keeps everything when the transmission fails', async () => {
    await logSet()
    await logSet()

    const result = await new SyncPendingSetsUseCase(queue, new UnreachableGateway()).execute()

    expect(result.confirmed).toBe(0)
    expect(result.pending).toBe(2)
    expect(await countPending.execute()).toBe(2)
  })

  it('keeps only what the server did not name on a partial acceptance', async () => {
    const kept = await logSet()
    const taken = await logSet(sessionId, new Date('2026-09-20T08:20:00.000Z'))

    const result = await new SyncPendingSetsUseCase(
      queue,
      new PartialGateway((id) => id === taken.id),
    ).execute()

    expect(result.confirmed).toBe(1)
    expect(await queue.findOne(Criteria.create({ id: kept.id }))).not.toBeNull()
    expect(await queue.findOne(Criteria.create({ id: taken.id }))).toBeNull()
  })

  it('sends nothing twice: a drained queue has nothing left to replay', async () => {
    await logSet()
    const gateway = new RecordingGateway()
    const sync = new SyncPendingSetsUseCase(queue, gateway)

    await sync.execute()
    const second = await sync.execute()

    expect(second.confirmed).toBe(0)
    expect(gateway.delivered).toHaveLength(1)
  })

  it('re-sends a set whose confirmation was lost, and the id keeps it one set', async () => {
    const set = await logSet()

    // The server received it; the acknowledgement never arrived.
    await new SyncPendingSetsUseCase(queue, new UnreachableGateway()).execute()
    const gateway = new RecordingGateway()
    await new SyncPendingSetsUseCase(queue, gateway).execute()

    expect(gateway.delivered[0]?.ids).toEqual([set.id])
  })
})

describe('sets of a workout that no longer exists', () => {
  it('lets them go instead of retrying them forever', async () => {
    await logSet(sessionId)
    await logSet(otherSessionId)
    const gateway = new GoneWorkoutGateway(sessionId)

    const result = await new SyncPendingSetsUseCase(queue, gateway).execute()

    expect(gateway.delivered).toEqual([otherSessionId])
    expect(result.pending).toBe(0)
  })
})
