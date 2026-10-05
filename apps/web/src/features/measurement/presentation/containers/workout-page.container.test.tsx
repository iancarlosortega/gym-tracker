/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routinesKeys } from '../../../routines/presentation/queries'
import { useStartWorkout } from '../../../workouts/presentation/queries'
import { WorkoutPageContainer } from './workout-page.container'

vi.mock('../../../workouts/presentation/offline-work', () => ({
  offlineWork: () => ({ finishes: { all: async () => [] } }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const server = vi.hoisted(() => ({
  starts: [] as { resolve: (value: unknown) => void; reject: (reason: unknown) => void }[],
  current: null as unknown,
}))

vi.mock('../../../workouts/infrastructure/workouts.api', () => ({
  getCurrentWorkout: async () => server.current,
  getExercises: async () => [],
  getEquipment: async () => [],
  startWorkout: () =>
    new Promise((resolve, reject) => {
      server.starts.push({ resolve, reject })
    }),
}))
vi.mock('../../../routines/infrastructure/routines.api', () => ({
  getRoutines: async () => ({ routines: [], upNextRoutineId: null }),
  getRoutine: async () => ({ id: 'r-1', name: 'Push day', archived: false, entries: [] }),
}))

afterEach(() => {
  cleanup()
  server.starts = []
  server.current = null
})

/** The start a drawer fires just before it opens this page. */
const Starter = ({ routineId }: { routineId: string }) => {
  const start = useStartWorkout()
  return (
    <button type="button" onClick={() => start.mutate(routineId)}>
      start
    </button>
  )
}

const setup = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  })
  client.setQueryData(routinesKeys.list(), {
    routines: [{ id: 'r-1', name: 'Push day', archived: false, entries: [], lastDoneAt: null }],
    upNextRoutineId: 'r-1',
  })
  render(
    <QueryClientProvider client={client}>
      <Starter routineId="r-1" />
      <WorkoutPageContainer />
    </QueryClientProvider>,
  )
}

describe('WorkoutPageContainer', () => {
  it('shows the routine starting while the server confirms the workout', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'start' }))

    expect(await screen.findByRole('heading', { name: 'Push day' })).toBeTruthy()
    expect(screen.getByText('Starting…')).toBeTruthy()
  })

  it('says it could not start, and starts again on Try again', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'start' }))
    await waitFor(() => expect(server.starts).toHaveLength(1))

    await act(async () => server.starts[0]?.reject(new Error('unreachable')))

    expect((await screen.findByRole('alert')).textContent).toBe('Could not start Push day.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(server.starts).toHaveLength(2)
  })

  it('offers to start when no workout is open', async () => {
    setup()

    expect(await screen.findByRole('button', { name: 'Start a workout' })).toBeTruthy()
  })
})
