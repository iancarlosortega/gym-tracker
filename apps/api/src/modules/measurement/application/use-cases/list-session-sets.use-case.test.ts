import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryWorkoutSessionRepository } from '../../../workouts/testing/in-memory-workout-session.repository.ts'
import { InMemorySetRepository } from '../../testing/in-memory-set.repository.ts'
import { ListSessionSetsUseCase } from './list-session-sets.use-case.ts'

const owner = Id.create()

let sets: InMemorySetRepository
let sessions: InMemoryWorkoutSessionRepository
let list: ListSessionSetsUseCase
let session: WorkoutSession

const setAt = (sessionId: string, minute: number) =>
  LoggedSet.create({
    id: Id.create().value,
    sessionId,
    exerciseId: Id.create().value,
    equipmentId: 'q-1',
    entry: LoadEntry.total(fromKilograms(60)),
    reps: reps(5),
    loggedAt: new Date(Date.UTC(2026, 9, 4, 9, minute)),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'q-1' },
  })

beforeEach(async () => {
  sets = new InMemorySetRepository()
  sessions = new InMemoryWorkoutSessionRepository()
  list = new ListSessionSetsUseCase(sets, sessions)
  session = WorkoutSession.start({ userId: owner, startedAt: new Date('2026-10-04T09:00:00Z') })
  await sessions.save(session)
})

describe('the sets of one workout', () => {
  it('lists the workout’s sets in the order they were logged', async () => {
    const later = setAt(session.id.value, 9)
    const earlier = setAt(session.id.value, 3)
    await sets.saveMany([later, earlier, setAt(Id.create().value, 5)])

    const found = await list.execute({ userId: owner.value, sessionId: session.id.value })

    expect(found.map((set) => set.id)).toEqual([earlier.id, later.id])
  })

  it('refuses someone else’s workout', async () => {
    await expect(
      list.execute({ userId: Id.create().value, sessionId: session.id.value }),
    ).rejects.toBeInstanceOf(WorkoutSessionNotFoundError)
  })
})
