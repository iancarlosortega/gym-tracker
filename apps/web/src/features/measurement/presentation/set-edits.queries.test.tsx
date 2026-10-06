/** @vitest-environment jsdom */
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { IDBFactory } from 'fake-indexeddb'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { workoutsKeys } from '../../workouts/presentation/queries'
import { IndexedDbSetRepository } from '../infrastructure/indexed-db-set.repository'
import { useCorrectSet, useDeleteSet } from './set-edits.queries'
import type { DoneSet } from './workout/done-sets'

const server = vi.hoisted(() => ({
  held: [] as { resolve: () => void; reject: (error: Error) => void }[],
  corrected: [] as { id: string; body: unknown }[],
  deleted: [] as string[],
}))

vi.mock('../infrastructure/sets.api', () => ({
  correctSet: (id: string, body: unknown) =>
    new Promise((resolve, reject) => {
      server.corrected.push({ id, body })
      server.held.push({ resolve: () => resolve({}), reject })
    }),
  deleteSet: (id: string) =>
    new Promise<void>((resolve, reject) => {
      server.deleted.push(id)
      server.held.push({ resolve, reject })
    }),
}))

vi.mock('../infrastructure/session-sets.api', () => ({ getSessionSets: async () => [] }))

const sessionId = '0199a1f0-0000-7000-8000-0000000000a1'

const bench: DoneSet = {
  id: '0199a1f0-0000-7000-8000-0000000000b1',
  exerciseId: 'e-1',
  equipmentId: 'q-1',
  mode: 'PER_SIDE',
  loggedAt: new Date('2026-10-05T18:10:00Z'),
  grams: 60_000,
  rawGrams: 20_000,
  position: null,
  reps: 8,
  pending: false,
}

let queue: IndexedDbSetRepository

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  queue = new IndexedDbSetRepository()
  server.held = []
  server.corrected = []
  server.deleted = []
})

const setup = (sets: readonly DoneSet[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  })
  client.setQueryData(workoutsKeys.sessionSets(sessionId), sets)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const shown = () => client.getQueryData<DoneSet[]>(workoutsKeys.sessionSets(sessionId))
  return { wrapper, shown }
}

const queuedBench = () =>
  LoggedSet.create({
    id: bench.id,
    sessionId,
    exerciseId: 'e-1',
    equipmentId: 'q-1',
    entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
    reps: reps(8),
    loggedAt: bench.loggedAt,
    snapshot: { barGrams: fromKilograms(20), displayUnit: 'KG', equipmentId: 'q-1' },
  })

describe('correcting a synced set', () => {
  it('shows the new load and reps before the server answers', async () => {
    const { wrapper, shown } = setup([bench])
    const { result } = renderHook(() => useCorrectSet(sessionId, queue), { wrapper })

    act(() => result.current.mutate({ set: bench, value: 25, reps: 10, unit: 'KG' }))

    await waitFor(() => expect(shown()?.[0]).toMatchObject({ grams: 70_000, rawGrams: 25_000 }))
    expect(shown()?.[0]?.reps).toBe(10)
    expect(server.corrected).toEqual([{ id: bench.id, body: { grams: 25_000, reps: 10 } }])
  })

  it('puts the set back when the server refuses', async () => {
    const { wrapper, shown } = setup([bench])
    const { result } = renderHook(() => useCorrectSet(sessionId, queue), { wrapper })

    act(() => result.current.mutate({ set: bench, value: 25, reps: 10, unit: 'KG' }))
    await waitFor(() => expect(server.held).toHaveLength(1))
    act(() => server.held[0]?.reject(new Error('offline')))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(shown()?.[0]).toMatchObject({ grams: 60_000, reps: 8 })
  })
})

describe('correcting a set still waiting to sync', () => {
  it('rewrites it in the queue, without calling the server', async () => {
    await queue.save(queuedBench())
    const pendingBench = { ...bench, pending: true }
    const { wrapper } = setup([pendingBench])
    const { result } = renderHook(() => useCorrectSet(sessionId, queue), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ set: pendingBench, value: 25, reps: 10, unit: 'KG' })
    })

    const stored = await queue.findOne(Criteria.create({ id: bench.id }))
    expect(stored?.mass()).toEqual({ kind: 'resolved', grams: fromKilograms(70) })
    expect(stored?.reps).toBe(10)
    expect(server.corrected).toEqual([])
  })
})

describe('deleting a set', () => {
  it('takes a synced set off the list before the server answers', async () => {
    const { wrapper, shown } = setup([bench])
    const { result } = renderHook(() => useDeleteSet(sessionId, queue), { wrapper })

    act(() => result.current.mutate(bench))

    await waitFor(() => expect(shown()).toEqual([]))
    expect(server.deleted).toEqual([bench.id])
  })

  it('drops a queued set from the queue so it is never sent', async () => {
    await queue.save(queuedBench())
    const pendingBench = { ...bench, pending: true }
    const { wrapper } = setup([pendingBench])
    const { result } = renderHook(() => useDeleteSet(sessionId, queue), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(pendingBench)
    })

    expect(await queue.count(Criteria.none())).toBe(0)
    expect(server.deleted).toEqual([])
  })
})
