import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { LastSetsRepository } from '@gym/domain/measurement/repositories/last-sets.repository'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { describe, expect, it, vi } from 'vitest'
import { GetLastSetsUseCase } from './get-last-sets.use-case.ts'

const startedAt = new Date('2026-09-28T09:00:00Z')

const set = (entry: LoadEntry, repetitions: number, minute: number) =>
  LoggedSet.create({
    id: Id.create().value,
    sessionId: 's-1',
    exerciseId: 'e-1',
    equipmentId: 'q-1',
    entry,
    reps: reps(repetitions),
    loggedAt: new Date(startedAt.getTime() + minute * 60_000),
    snapshot: {
      barGrams: entry.mode === 'PER_SIDE' ? 20_000 : null,
      displayUnit: 'KG',
      equipmentId: 'q-1',
    },
  })

const repositoryWith = (answer: Awaited<ReturnType<LastSetsRepository['lastSession']>>) => ({
  lastSession: vi.fn(async () => answer),
})

describe('what was done last time', () => {
  it('numbers the sets in the order they were logged, with the value as entered', async () => {
    const repository = repositoryWith({
      sessionStartedAt: startedAt,
      sets: [
        set(LoadEntry.perSide(fromKilograms(20), fromKilograms(20)), 8, 5),
        set(LoadEntry.perSide(fromKilograms(22.5), fromKilograms(20)), 6, 9),
      ],
    })

    const last = await new GetLastSetsUseCase(repository).execute({
      userId: 'u-1',
      exerciseId: 'e-1',
      excludingSessionId: 's-open',
    })

    expect(last).toEqual({
      sessionStartedAt: startedAt,
      sets: [
        { setNumber: 1, mode: 'PER_SIDE', value: 20, reps: 8 },
        { setNumber: 2, mode: 'PER_SIDE', value: 22.5, reps: 6 },
      ],
    })
    expect(repository.lastSession).toHaveBeenCalledWith('u-1', 'e-1', 's-open')
  })

  it('reads a total as kilograms and a pin as its position', async () => {
    const last = await new GetLastSetsUseCase(
      repositoryWith({
        sessionStartedAt: startedAt,
        sets: [
          set(LoadEntry.total(fromKilograms(60)), 5, 1),
          set(LoadEntry.stack(stackPosition(7)), 12, 2),
        ],
      }),
    ).execute({ userId: 'u-1', exerciseId: 'e-1', excludingSessionId: null })

    expect(last?.sets.map((entry) => [entry.mode, entry.value])).toEqual([
      ['TOTAL', 60],
      ['STACK_POSITION', 7],
    ])
  })

  it('is nothing when the exercise was never done before', async () => {
    const last = await new GetLastSetsUseCase(repositoryWith(null)).execute({
      userId: 'u-1',
      exerciseId: 'e-1',
      excludingSessionId: null,
    })

    expect(last).toBeNull()
  })
})
