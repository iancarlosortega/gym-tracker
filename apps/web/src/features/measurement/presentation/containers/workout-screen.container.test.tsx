/** @vitest-environment jsdom */
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import type { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import type {
  LogSetOfflineInput,
  LogSetOfflineUseCase,
} from '../../application/log-set-offline.use-case'
import type { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { WorkoutScreenContainer } from './workout-screen.container.tsx'

vi.mock('../../infrastructure/session-sets.api', () => ({ getSessionSets: async () => [] }))
vi.mock('../../../catalog/infrastructure/equipment.api', () => ({
  createEquipment: async (equipment: { name: string }) => ({
    id: 'q-new',
    name: equipment.name,
    kind: 'BARBELL',
    barKilograms: 20,
    stackPositions: null,
    archived: false,
  }),
}))
vi.mock('../../infrastructure/last-sets.api', () => ({
  getLastSets: async () => ({
    sessionStartedAt: '2026-09-28T09:00:00.000Z',
    sets: [{ setNumber: 1, mode: 'PER_SIDE', value: 20, reps: 8 }],
  }),
}))

afterEach(cleanup)

const clock = { now: () => new Date() }
const wakeLock = { acquire: async () => {}, release: async () => {} }

const bench = { id: 'e-1', name: 'Bench press', defaultMode: 'PER_SIDE' as const, archived: false }
const bar = {
  id: 'q-1',
  name: 'Olympic bar',
  kind: 'BARBELL',
  barKilograms: 20,
  stackPositions: null,
  archived: false,
}

const incline = { id: 'e-2', name: 'Incline press', defaultMode: 'TOTAL' as const, archived: false }
const dumbbells = { ...bar, id: 'q-2', name: 'Dumbbells', kind: 'FREE_WEIGHT', barKilograms: null }

const renderScreen = ({
  equipment = [bar] as (typeof bar | typeof dumbbells)[],
  extraExercise = false,
} = {}) => {
  const logged: LogSetOfflineInput[] = []
  const logSet = {
    execute: vi.fn(async (input: LogSetOfflineInput) => {
      logged.push(input)
      return LoggedSet.create({ ...input, reps: reps(input.reps), id: `s-${logged.length}` })
    }),
  } as unknown as LogSetOfflineUseCase
  const queue = { findMany: async () => ({ items: [] }) } as unknown as SetRepository

  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkoutScreenContainer
        sessionId="w-1"
        startedAt={new Date()}
        routine={{
          name: 'Push day',
          entries: [
            ...(extraExercise
              ? [
                  {
                    id: 'n-2',
                    exerciseId: 'e-2',
                    equipmentId: null,
                    position: 2,
                    targetSets: 3,
                    targetReps: '8-10',
                    restSeconds: 90,
                  },
                ]
              : []),
            {
              id: 'n-1',
              exerciseId: 'e-1',
              equipmentId: null,
              position: 1,
              targetSets: 3,
              targetReps: '6-8',
              restSeconds: 90,
            },
          ],
        }}
        exercises={extraExercise ? [bench, incline] : [bench]}
        equipment={equipment}
        queue={queue}
        logSet={logSet}
        syncSets={{ execute: async () => ({ pending: 0 }) } as unknown as SyncPendingSetsUseCase}
        countPending={{ execute: async () => 0 } as unknown as CountPendingSetsUseCase}
        startRest={new StartRestUseCase(clock, wakeLock)}
        restSecondsFor={() => 90}
        clock={clock}
        wakeLock={wakeLock}
        cue={{ play: async () => {} }}
        finishing={false}
        onFinish={vi.fn()}
      />
    </QueryClientProvider>,
  )

  return { logged }
}

describe('the workout screen, wired', () => {
  it('logs a set typed on the keypad, on the only fitting bar, then rests', async () => {
    const { logged } = renderScreen()

    expect(screen.getByRole('heading', { name: 'Bench press' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Equipment: Olympic bar. Change' })).toBeDefined()
    await screen.findByText('20 kg/side × 8')

    await userEvent.click(screen.getByRole('button', { name: /weight per side/i }))
    for (const key of ['2', '2', 'Decimal point', '5', 'Reps ›', '6']) {
      await userEvent.click(screen.getByRole('button', { name: key }))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Log set 1' }))

    await waitFor(() => expect(logged).toHaveLength(1))
    expect(logged[0]).toMatchObject({
      sessionId: 'w-1',
      exerciseId: 'e-1',
      equipmentId: 'q-1',
      reps: 6,
    })
    expect(logged[0]?.entry.toJSON()).toMatchObject({ mode: 'PER_SIDE', perSideGrams: 22_500 })
    expect(await screen.findByText(/Bench press/)).toBeDefined()
  })

  it('fills from last time', async () => {
    renderScreen()
    await screen.findByText('20 kg/side × 8')

    await userEvent.click(screen.getByRole('button', { name: /weight per side/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Same as last' }))

    expect(screen.getByRole('button', { name: 'Weight per side, 20 kilograms' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reps, 8' })).toBeDefined()
  })

  it('says why a set cannot be logged, and offers equipment that fits when there is none', async () => {
    renderScreen({ equipment: [dumbbells] })

    expect(screen.getByText('Pick the equipment to log this set.')).toBeDefined()

    await userEvent.click(screen.getByRole('button', { name: 'Pick the equipment' }))
    expect(await screen.findByText(/Nothing you have can measure weight per side/)).toBeDefined()
    expect(screen.getAllByRole('radio')).toHaveLength(1)

    await userEvent.type(screen.getByLabelText('Name'), 'Olympic bar')
    await userEvent.type(screen.getByLabelText('Bar weight (kg)'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(
      await screen.findByRole('button', { name: 'Equipment: Olympic bar. Change' }),
    ).toBeDefined()
  })

  it('keeps each exercise’s own weight and reps', async () => {
    renderScreen({ extraExercise: true })

    await userEvent.click(screen.getByRole('button', { name: /weight per side/i }))
    for (const key of ['3', '0']) {
      await userEvent.click(screen.getByRole('button', { name: key }))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next exercise' }))

    expect(screen.getByRole('heading', { name: 'Incline press' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Weight, not entered' })).toBeDefined()

    await userEvent.click(screen.getByRole('button', { name: 'Previous exercise' }))
    expect(screen.getByRole('button', { name: 'Weight per side, 30 kilograms' })).toBeDefined()
  })
})
