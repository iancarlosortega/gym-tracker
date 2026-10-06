/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { historyKeys, useDeleteWorkout, useWorkoutHistory } from './history.queries'

const server = vi.hoisted(() => ({
  pages: [] as unknown[],
  windows: [] as unknown[],
  deleted: [] as string[],
  failDelete: false,
}))

vi.mock('../infrastructure/history.api', () => ({
  getWorkoutHistory: async (window: unknown) => {
    server.windows.push(window)
    return server.pages.shift()
  },
  getWorkout: async () => ({}),
  deleteWorkout: async (id: string) => {
    if (server.failDelete) throw new Error('offline')
    server.deleted.push(id)
  },
}))

const entry = (id: string) => ({
  id,
  routineId: null,
  routineName: null,
  startedAt: '2026-10-01T23:10:00.000Z',
  finishedAt: null,
  setCount: 0,
})

const wrap =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('the history list', () => {
  it('reads the next page from where the last one stopped', async () => {
    server.pages = [
      { items: [entry('a'), entry('b')], nextOffset: 2 },
      { items: [entry('c')], nextOffset: null },
    ]
    server.windows = []
    const { result } = renderHook(() => useWorkoutHistory(), { wrapper: wrap(newClient()) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    expect(result.current.data?.pages.flatMap((page) => page.items.map((item) => item.id))).toEqual(
      ['a', 'b', 'c'],
    )
    expect(server.windows).toEqual([
      { limit: 20, offset: 0 },
      { limit: 20, offset: 2 },
    ])
  })
})

describe('deleting a workout', () => {
  const stores = () => {
    const removedSets: string[] = []
    const removedFinishes: string[] = []
    return {
      removedSets,
      removedFinishes,
      sets: {
        findMany: async () => ({ items: [{ id: 's-1' }, { id: 's-2' }] }),
        delete: async (id: string) => {
          removedSets.push(id)
        },
      },
      finishes: {
        delete: async (sessionId: string) => {
          removedFinishes.push(sessionId)
        },
      },
    }
  }

  it('drops what the phone still holds for it, then deletes it and refreshes history', async () => {
    server.deleted = []
    server.failDelete = false
    const client = newClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const local = stores()
    const { result } = renderHook(() => useDeleteWorkout(local), { wrapper: wrap(client) })

    await act(async () => {
      await result.current.mutateAsync('w-1')
    })

    expect(local.removedSets).toEqual(['s-1', 's-2'])
    expect(local.removedFinishes).toEqual(['w-1'])
    expect(server.deleted).toEqual(['w-1'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: historyKeys.all })
  })

  it('reports a failure and leaves the workout in history', async () => {
    server.failDelete = true
    const client = newClient()
    const { result } = renderHook(() => useDeleteWorkout(stores()), { wrapper: wrap(client) })

    act(() => result.current.mutate('w-1'))

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
