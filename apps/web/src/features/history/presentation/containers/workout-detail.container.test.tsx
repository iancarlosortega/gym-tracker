/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkoutDetailContainer } from './workout-detail.container.tsx'

const nav = vi.hoisted(() => ({ pushed: [] as string[] }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: (href: string) => nav.pushed.push(href) }),
}))
vi.mock('../../../auth/presentation/queries', () => ({ useDisplayUnit: () => 'KG' }))

const server = vi.hoisted(() => ({ deleted: [] as string[] }))

vi.mock('../../infrastructure/history.api', () => ({
  getWorkout: async () => ({
    id: 'w-push',
    routineId: 'r-1',
    routineName: 'Push day',
    startedAt: '2026-10-01T23:10:00.000Z',
    finishedAt: '2026-10-02T00:05:00.000Z',
    setCount: 3,
  }),
  getWorkoutHistory: async () => ({ items: [], nextOffset: null }),
  deleteWorkout: async (id: string) => {
    server.deleted.push(id)
  },
}))

const set = (id: string, exerciseId: string, minute: number, rawGrams: number, reps: number) => ({
  id,
  sessionId: 'w-push',
  exerciseId,
  equipmentId: 'q-bar',
  mode: 'TOTAL',
  reps,
  loggedAt: `2026-10-01T23:${String(minute).padStart(2, '0')}:00.000Z`,
  resolvedGrams: rawGrams,
  stackPosition: null,
  rawGrams,
  revision: 0,
})

vi.mock('../../../measurement/infrastructure/session-sets.api', () => ({
  getSessionSets: async () => [
    set('s-2', 'e-row', 30, 70_000, 8),
    set('s-1', 'e-bench', 12, 60_000, 8),
    set('s-3', 'e-bench', 15, 62_500, 6),
  ],
}))

vi.mock('../../../workouts/infrastructure/workouts.api', () => ({
  getExercises: async () => [
    { id: 'e-bench', name: 'Bench press', defaultMode: 'TOTAL', archived: false },
    { id: 'e-row', name: 'Row', defaultMode: 'TOTAL', archived: false },
  ],
  getEquipment: async () => [
    {
      id: 'q-bar',
      name: 'Olympic bar',
      kind: 'BARBELL',
      barKilograms: 20,
      stackPositions: null,
      archived: false,
    },
  ],
  getCurrentWorkout: async () => null,
  finishWorkout: async () => ({}),
}))

afterEach(cleanup)

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  nav.pushed = []
  server.deleted = []
})

const renderDetail = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <WorkoutDetailContainer workoutId="w-push" zone="America/Guayaquil" />
    </QueryClientProvider>,
  )

describe('WorkoutDetailContainer', () => {
  it('shows the workout in local time, its exercises in the order they were first done', async () => {
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Push day' })).toBeDefined()
    expect(screen.getByText('Thu, Oct 1 · 18:10 – 19:05')).toBeDefined()
    const sections = await screen.findAllByRole('region')
    expect(sections.map((section) => section.getAttribute('aria-label'))).toEqual([
      'Bench press',
      'Row',
    ])
    expect(
      within(sections[0] as HTMLElement)
        .getAllByRole('button')
        .map((row) => row.textContent),
    ).toEqual([expect.stringMatching(/60 kg × 8/), expect.stringMatching(/62.5 kg × 6/)])
  })

  it('deletes after confirming, then goes back to History', async () => {
    renderDetail()

    await userEvent.click(await screen.findByRole('button', { name: 'Delete workout' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(nav.pushed).toEqual(['/statistics/history']))
    expect(server.deleted).toEqual(['w-push'])
  })
})
