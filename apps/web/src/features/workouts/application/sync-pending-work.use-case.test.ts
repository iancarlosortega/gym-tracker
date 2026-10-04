import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetSyncGateway } from '@gym/domain/measurement/ports/set-sync.gateway'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { LogSetOfflineUseCase } from '../../measurement/application/log-set-offline.use-case.ts'
import { SyncPendingSetsUseCase } from '../../measurement/application/sync-pending-sets.use-case.ts'
import { IndexedDbSetRepository } from '../../measurement/infrastructure/indexed-db-set.repository.ts'
import { IndexedDbPendingFinishStore } from '../infrastructure/indexed-db-pending-finish.store.ts'
import { FinishWorkoutOfflineUseCase } from './finish-workout-offline.use-case.ts'
import { SyncPendingWorkUseCase } from './sync-pending-work.use-case.ts'

const sessionId = '0199a1f0-0000-7000-8000-0000000000a1'
const pressedAt = new Date('2026-10-04T10:30:00.000Z')

/** Everything the network was asked to do, in order. */
let sent: string[]
let setsReachable: boolean
let finishReachable: boolean

const gateway: SetSyncGateway = {
  async push(session: string, sets: readonly LoggedSet[]) {
    if (!setsReachable) throw new Error('Failed to fetch')
    sent.push(`sets:${session}:${sets.length}`)
    return sets.map((set) => set.id)
  },
}

const finishOnServer = async (session: string, finishedAt: Date) => {
  if (!finishReachable) throw new Error('Failed to fetch')
  sent.push(`finish:${session}:${finishedAt.toISOString()}`)
}

let queue: IndexedDbSetRepository
let finishes: IndexedDbPendingFinishStore
let sync: SyncPendingWorkUseCase
let finishOffline: FinishWorkoutOfflineUseCase

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  sent = []
  setsReachable = true
  finishReachable = true
  queue = new IndexedDbSetRepository()
  finishes = new IndexedDbPendingFinishStore()
  sync = new SyncPendingWorkUseCase(
    new SyncPendingSetsUseCase(queue, gateway),
    queue,
    finishes,
    finishOnServer,
  )
  finishOffline = new FinishWorkoutOfflineUseCase(finishes, { now: () => pressedAt })
})

const logSet = async () =>
  await new LogSetOfflineUseCase(queue).execute({
    sessionId,
    exerciseId: '0199a1f0-0000-7000-8000-0000000000a2',
    equipmentId: '0199a1f0-0000-7000-8000-0000000000a3',
    entry: LoadEntry.total(fromKilograms(60)),
    reps: 8,
    loggedAt: new Date('2026-10-04T10:28:00.000Z'),
    snapshot: {
      barGrams: null,
      displayUnit: 'KG',
      equipmentId: '0199a1f0-0000-7000-8000-0000000000a3',
    },
  })

describe('finishing a workout offline', () => {
  it('records the instant the user pressed finish', async () => {
    await finishOffline.execute(sessionId)

    expect(await finishes.all()).toEqual([{ sessionId, finishedAt: pressedAt }])
  })
})

describe('syncing pending work', () => {
  it('sends the sets before the finish, so none arrive at a closed workout', async () => {
    await logSet()
    await logSet()
    await finishOffline.execute(sessionId)

    await sync.execute()

    expect(sent).toEqual([`sets:${sessionId}:2`, `finish:${sessionId}:${pressedAt.toISOString()}`])
    expect(await finishes.all()).toEqual([])
  })

  it('holds the finish while its own sets could not be sent', async () => {
    await logSet()
    await finishOffline.execute(sessionId)
    setsReachable = false

    await sync.execute()

    expect(sent).toEqual([])
    expect(await finishes.all()).toHaveLength(1)
  })

  it('sends a finish straight away when nothing was queued', async () => {
    await finishOffline.execute(sessionId)

    await sync.execute()

    expect(sent).toEqual([`finish:${sessionId}:${pressedAt.toISOString()}`])
  })

  it('keeps the finish for next time when it could not be sent', async () => {
    await finishOffline.execute(sessionId)
    finishReachable = false

    await sync.execute()

    expect(await finishes.all()).toHaveLength(1)
  })
})
