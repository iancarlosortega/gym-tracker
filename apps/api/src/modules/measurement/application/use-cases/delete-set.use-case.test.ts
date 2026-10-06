import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { SetNotFoundError } from '@gym/domain/measurement/errors'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryPushScheduler } from '../../../push/testing/in-memory-push.ts'
import { InMemoryWorkoutSessionRepository } from '../../../workouts/testing/in-memory-workout-session.repository.ts'
import { InMemorySetRepository } from '../../testing/in-memory-set.repository.ts'
import { DeleteSetUseCase } from './delete-set.use-case.ts'

const owner = Id.create()

let sets: InMemorySetRepository
let sessions: InMemoryWorkoutSessionRepository
let scheduler: InMemoryPushScheduler
let deleteSet: DeleteSetUseCase
let set: LoggedSet

beforeEach(async () => {
  sets = new InMemorySetRepository()
  sessions = new InMemoryWorkoutSessionRepository()
  scheduler = new InMemoryPushScheduler()
  deleteSet = new DeleteSetUseCase(sets, sessions, scheduler)

  const session = WorkoutSession.start({
    userId: owner,
    startedAt: new Date('2026-10-05T18:00:00Z'),
  })
  await sessions.save(session)

  set = LoggedSet.create({
    id: Id.create().value,
    sessionId: session.id.value,
    exerciseId: Id.create().value,
    equipmentId: 'q-1',
    entry: LoadEntry.total(fromKilograms(60)),
    reps: reps(8),
    loggedAt: new Date('2026-10-05T18:10:00Z'),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'q-1' },
  })
  await sets.save(set)
})

const live = async (id: string) => await sets.findOne(Criteria.create({ id }))

describe('deleting a logged set', () => {
  it('removes the set from every read', async () => {
    await deleteSet.execute({ userId: owner.value, setId: set.id })

    expect(await live(set.id)).toBeNull()
  })

  it('cancels a rest alert still waiting for that set', async () => {
    const now = new Date('2026-10-05T18:10:00Z')
    await scheduler.schedule(
      ScheduledPush.schedule({
        userId: owner,
        setId: Id.restore(set.id),
        fireAt: new Date('2026-10-05T18:12:00Z'),
        now,
      }),
    )

    await deleteSet.execute({ userId: owner.value, setId: set.id })

    expect(scheduler.pushes.size).toBe(0)
  })

  it('reports a set already deleted as not found', async () => {
    await deleteSet.execute({ userId: owner.value, setId: set.id })

    await expect(deleteSet.execute({ userId: owner.value, setId: set.id })).rejects.toBeInstanceOf(
      SetNotFoundError,
    )
  })

  it('reports someone else’s set as not found and keeps it', async () => {
    await expect(
      deleteSet.execute({ userId: Id.create().value, setId: set.id }),
    ).rejects.toBeInstanceOf(SetNotFoundError)
    expect(await live(set.id)).not.toBeNull()
  })
})
