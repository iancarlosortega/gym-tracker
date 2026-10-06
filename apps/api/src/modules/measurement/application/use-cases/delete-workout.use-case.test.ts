import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryPushScheduler } from '../../../push/testing/in-memory-push.ts'
import { InMemoryWorkoutSessionRepository } from '../../../workouts/testing/in-memory-workout-session.repository.ts'
import { InMemorySetRepository } from '../../testing/in-memory-set.repository.ts'
import { DeleteWorkoutUseCase } from './delete-workout.use-case.ts'

const owner = Id.create()
const now = new Date('2026-10-05T18:10:00Z')

let sets: InMemorySetRepository
let sessions: InMemoryWorkoutSessionRepository
let scheduler: InMemoryPushScheduler
let deleteWorkout: DeleteWorkoutUseCase
let doomed: WorkoutSession
let kept: WorkoutSession

const setIn = (session: WorkoutSession) =>
  LoggedSet.create({
    id: Id.create().value,
    sessionId: session.id.value,
    exerciseId: Id.create().value,
    equipmentId: 'q-1',
    entry: LoadEntry.total(fromKilograms(60)),
    reps: reps(8),
    loggedAt: now,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'q-1' },
  })

const alertFor = (set: LoggedSet) =>
  ScheduledPush.schedule({
    userId: owner,
    setId: Id.restore(set.id),
    fireAt: new Date('2026-10-05T18:12:00Z'),
    now,
  })

beforeEach(async () => {
  sets = new InMemorySetRepository()
  sessions = new InMemoryWorkoutSessionRepository()
  scheduler = new InMemoryPushScheduler()
  deleteWorkout = new DeleteWorkoutUseCase(sessions, sets, scheduler)

  doomed = WorkoutSession.start({ userId: owner, startedAt: new Date('2026-10-05T18:00:00Z') })
  kept = WorkoutSession.start({ userId: owner, startedAt: new Date('2026-10-04T18:00:00Z') })
  await sessions.save(doomed)
  await sessions.save(kept)
})

describe('deleting a workout', () => {
  it('removes the workout', async () => {
    await deleteWorkout.execute({ userId: owner.value, sessionId: doomed.id.value })

    expect(await sessions.findOne(Criteria.create({ id: doomed.id.value }))).toBeNull()
    expect(await sessions.findOne(Criteria.create({ id: kept.id.value }))).not.toBeNull()
  })

  it('cancels the rest alerts still waiting for its sets, and only those', async () => {
    const mine = setIn(doomed)
    const other = setIn(kept)
    await sets.saveMany([mine, other])
    await scheduler.schedule(alertFor(mine))
    await scheduler.schedule(alertFor(other))

    await deleteWorkout.execute({ userId: owner.value, sessionId: doomed.id.value })

    expect([...scheduler.pushes.values()].map((push) => push.setId.value)).toEqual([other.id])
  })

  it('refuses someone else’s workout and deletes nothing', async () => {
    await expect(
      deleteWorkout.execute({ userId: Id.create().value, sessionId: doomed.id.value }),
    ).rejects.toBeInstanceOf(WorkoutSessionNotFoundError)
    expect(await sessions.findOne(Criteria.create({ id: doomed.id.value }))).not.toBeNull()
  })
})
