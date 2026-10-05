/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { RoutineListing, RoutineResponse } from '../infrastructure/routines.api'
import {
  routinesKeys,
  targetRepsText,
  useChangeRoutineEntry,
  useRenameRoutine,
  useReorderRoutine,
  useReorderRoutines,
} from './queries'

const server = vi.hoisted(() => ({
  held: [] as (() => void)[],
  refuse: false,
  order: [] as string[][],
}))

/** Every write waits until the test lets the server answer it. */
const hold = <T,>(answer: () => T) =>
  new Promise<T>((resolve, reject) => {
    server.held.push(() => (server.refuse ? reject(new Error('refused')) : resolve(answer())))
  })

vi.mock('../infrastructure/routines.api', () => ({
  getRoutines: async () => ({ routines: [], upNextRoutineId: null }),
  getRoutine: async () => ({ id: 'r-1', name: 'Push day', archived: false, entries: [] }),
  renameRoutine: () => hold(() => ({})),
  changeRoutineEntry: () => hold(() => ({})),
  reorderRoutines: (routineIds: string[]) =>
    hold(() => {
      server.order.push(routineIds)
    }),
  reorderRoutine: (_routineId: string, entryIds: string[]) =>
    hold(() => {
      server.order.push(entryIds)
      return {}
    }),
}))

const entry = (id: string, position: number) => ({
  id,
  exerciseId: `e-${id}`,
  equipmentId: null,
  position,
  targetSets: 3,
  targetReps: '8-12',
  restSeconds: 180,
})

const pushDay: RoutineResponse = {
  id: 'r-1',
  name: 'Push day',
  archived: false,
  entries: [entry('a', 0), entry('b', 1), entry('c', 2), entry('d', 3)],
}

const setup = () => {
  server.held = []
  server.refuse = false
  server.order = []
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  })
  client.setQueryData(routinesKeys.detail('r-1'), pushDay)
  client.setQueryData<RoutineListing>(routinesKeys.list(), {
    routines: [{ ...pushDay, lastDoneAt: null }],
    upNextRoutineId: 'r-1',
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

const plan = (client: QueryClient) =>
  client.getQueryData<RoutineResponse>(routinesKeys.detail('r-1'))
const listed = (client: QueryClient) =>
  client.getQueryData<RoutineListing>(routinesKeys.list())?.routines[0]

const answerAll = async () => {
  while (server.held.length > 0) {
    await act(async () => server.held.shift()?.())
    await act(async () => {})
  }
}

describe('instant routine writes', () => {
  it('renames in the plan and the list before the server answers', async () => {
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useRenameRoutine(), { wrapper })

    act(() => result.current.mutate({ id: 'r-1', name: 'Push' }))

    await waitFor(() => expect(plan(client)?.name).toBe('Push'))
    expect(listed(client)?.name).toBe('Push')
    await answerAll()
  })

  it('puts the old name back when the server refuses', async () => {
    const { client, wrapper } = setup()
    server.refuse = true
    const { result } = renderHook(() => useRenameRoutine(), { wrapper })

    act(() => result.current.mutate({ id: 'r-1', name: 'Push' }))
    await waitFor(() => expect(plan(client)?.name).toBe('Push'))
    await waitFor(() => expect(server.held).toHaveLength(1))
    await answerAll()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(plan(client)?.name).toBe('Push day')
    expect(listed(client)?.name).toBe('Push day')
  })

  it('keeps three quick moves in the order they were tapped', async () => {
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useReorderRoutine('r-1'), { wrapper })
    const ids = () => plan(client)?.entries.map((item) => item.id) ?? []
    // Each tap reads the order on screen, as the up button does.
    const moveUp = async (id: string) => {
      const order = ids()
      const index = order.indexOf(id)
      const next = [...order]
      next.splice(index - 1, 0, ...next.splice(index, 1))
      act(() => result.current.mutate(next))
      await waitFor(() => expect(ids()).toEqual(next))
    }

    await moveUp('d')
    await moveUp('d')
    await moveUp('d')

    expect(ids()).toEqual(['d', 'a', 'b', 'c'])
    await answerAll()
    expect(server.order).toEqual([
      ['a', 'b', 'd', 'c'],
      ['a', 'd', 'b', 'c'],
      ['d', 'a', 'b', 'c'],
    ])
  })

  it('shows changed targets at once', async () => {
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useChangeRoutineEntry('r-1'), { wrapper })

    act(() =>
      result.current.mutate({
        entryId: 'b',
        targets: { targetSets: 5, targetRepsMin: 5, targetRepsMax: 5, restSeconds: 240 },
      }),
    )

    await waitFor(() =>
      expect(plan(client)?.entries[1]).toMatchObject({
        targetSets: 5,
        targetReps: '5',
        restSeconds: 240,
      }),
    )
    await answerAll()
  })
})

describe('the routine order', () => {
  it('moves routines at once, archived ones kept after them', async () => {
    const { client, wrapper } = setup()
    const legs = { ...pushDay, id: 'r-2', name: 'Legs', lastDoneAt: null }
    const old = { ...pushDay, id: 'r-3', name: 'Old', archived: true, lastDoneAt: null }
    client.setQueryData<RoutineListing>(routinesKeys.list(), {
      routines: [{ ...pushDay, lastDoneAt: null }, legs, old],
      upNextRoutineId: 'r-1',
    })
    const { result } = renderHook(() => useReorderRoutines(), { wrapper })

    act(() => result.current.mutate(['r-2', 'r-1']))

    await waitFor(() =>
      expect(
        client.getQueryData<RoutineListing>(routinesKeys.list())?.routines.map((r) => r.id),
      ).toEqual(['r-2', 'r-1', 'r-3']),
    )
    await answerAll()
    expect(server.order).toEqual([['r-2', 'r-1']])
  })
})

describe('targetRepsText', () => {
  it('spells targets the way the API does', () => {
    expect(targetRepsText(8, 12)).toBe('8-12')
    expect(targetRepsText(8, 8)).toBe('8')
    expect(targetRepsText(undefined, undefined)).toBeNull()
  })
})
