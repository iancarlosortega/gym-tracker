/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ExerciseResponse } from '../../workouts/infrastructure/workouts.api'
import { workoutsKeys } from '../../workouts/presentation/queries'
import { catalogKeys, useArchiveExercise, useRenameExercise } from './queries'

const server = vi.hoisted(() => ({ held: [] as (() => void)[] }))

vi.mock('../infrastructure/exercises.api', () => ({
  getCatalogExercises: async () => [],
  renameExercise: () => new Promise((resolve) => server.held.push(() => resolve({}))),
  archiveExercise: () => new Promise((resolve) => server.held.push(() => resolve({}))),
}))

const skullcrusher: ExerciseResponse = {
  id: 'e-1',
  name: 'Skullcrusher',
  defaultMode: 'TOTAL',
  archived: false,
}

const setup = () => {
  server.held = []
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  })
  client.setQueryData(catalogKeys.exercises(), [skullcrusher])
  client.setQueryData(workoutsKeys.exercises(), [skullcrusher])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const lists = () => ({
    catalog: client.getQueryData<ExerciseResponse[]>(catalogKeys.exercises()),
    pickers: client.getQueryData<ExerciseResponse[]>(workoutsKeys.exercises()),
  })
  return { wrapper, lists }
}

describe('instant catalog writes', () => {
  it('renames in the catalog and the pickers before the server answers', async () => {
    const { wrapper, lists } = setup()
    const { result } = renderHook(() => useRenameExercise(), { wrapper })

    act(() => result.current.mutate({ id: 'e-1', name: 'French press' }))

    await waitFor(() => expect(lists().catalog?.[0]?.name).toBe('French press'))
    expect(lists().pickers?.[0]?.name).toBe('French press')
  })

  it('archives out of the pickers at once and keeps it in the catalog as archived', async () => {
    const { wrapper, lists } = setup()
    const { result } = renderHook(() => useArchiveExercise(), { wrapper })

    act(() => result.current.mutate({ id: 'e-1' }))

    await waitFor(() => expect(lists().pickers).toEqual([]))
    expect(lists().catalog?.[0]?.archived).toBe(true)
  })
})
