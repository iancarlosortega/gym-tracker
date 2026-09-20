import { Routine } from '@gym/domain/routines/entities/routine.entity'
import { RoutineNotFoundError } from '@gym/domain/routines/errors'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import {
  WorkoutAlreadyFinishedError,
  WorkoutAlreadyOpenError,
  WorkoutSessionNotFoundError,
} from '@gym/domain/workouts/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { FixedClock } from '../../../auth/testing/in-memory-auth.ts'
import { InMemoryRoutineRepository } from '../../../routines/testing/in-memory-routine.repository.ts'
import { InMemoryWorkoutSessionRepository } from '../../testing/in-memory-workout-session.repository.ts'
import { FinishWorkoutUseCase } from './finish-workout.use-case.ts'
import { ResumeWorkoutUseCase } from './resume-workout.use-case.ts'
import { StartWorkoutUseCase } from './start-workout.use-case.ts'

const userId = Id.create()
const otherUserId = Id.create().value
const startedAt = new Date('2026-09-20T08:00:00.000Z')

let sessions: InMemoryWorkoutSessionRepository
let routines: InMemoryRoutineRepository
let clock: FixedClock
let start: StartWorkoutUseCase
let resume: ResumeWorkoutUseCase
let finish: FinishWorkoutUseCase

let pushDayId: string

beforeEach(async () => {
  sessions = new InMemoryWorkoutSessionRepository()
  routines = new InMemoryRoutineRepository()
  clock = new FixedClock(startedAt)

  start = new StartWorkoutUseCase(sessions, routines, clock)
  resume = new ResumeWorkoutUseCase(sessions)
  finish = new FinishWorkoutUseCase(sessions, clock)

  const pushDay = Routine.create({ userId, name: 'Push day' })
  await routines.save(pushDay)
  pushDayId = pushDay.id.value
})

describe('starting a workout', () => {
  it('starts ad hoc, with no routine behind it', async () => {
    const session = await start.execute({ userId: userId.value })

    expect(session.routineId).toBeNull()
    expect(session.isOpen).toBe(true)
    expect(session.startedAt).toEqual(startedAt)
  })

  it('starts from a routine the user owns', async () => {
    const session = await start.execute({ userId: userId.value, routineId: pushDayId })

    expect(session.routineId?.value).toBe(pushDayId)
  })

  it('refuses a routine belonging to someone else', async () => {
    await expect(start.execute({ userId: otherUserId, routineId: pushDayId })).rejects.toThrow(
      RoutineNotFoundError,
    )
  })

  it('refuses an archived routine', async () => {
    const archived = Routine.create({ userId, name: 'Old split' }).archivedAt(startedAt)
    await routines.save(archived)

    await expect(
      start.execute({ userId: userId.value, routineId: archived.id.value }),
    ).rejects.toThrow(RoutineNotFoundError)
  })

  it('refuses a second workout while one is still open', async () => {
    await start.execute({ userId: userId.value })

    await expect(start.execute({ userId: userId.value })).rejects.toThrow(WorkoutAlreadyOpenError)
  })

  it('allows a new workout once the previous one is finished', async () => {
    const first = await start.execute({ userId: userId.value })
    clock.advanceTo(new Date('2026-09-20T09:00:00.000Z'))
    await finish.execute({ userId: userId.value, sessionId: first.id.value })

    const second = await start.execute({ userId: userId.value })

    expect(second.id.value).not.toBe(first.id.value)
  })

  it("does not see another user's open workout", async () => {
    await start.execute({ userId: otherUserId })

    await expect(start.execute({ userId: userId.value })).resolves.toBeDefined()
  })
})

describe('resuming a workout', () => {
  it('returns the session that was left open, with its identity intact', async () => {
    const started = await start.execute({ userId: userId.value, routineId: pushDayId })

    const resumed = await resume.execute({ userId: userId.value })

    expect(resumed.id.value).toBe(started.id.value)
    expect(resumed.routineId?.value).toBe(pushDayId)
    expect(resumed.isOpen).toBe(true)
  })

  it('refuses when nothing is in progress', async () => {
    await expect(resume.execute({ userId: userId.value })).rejects.toThrow(
      WorkoutSessionNotFoundError,
    )
  })

  it('refuses once the workout has been finished', async () => {
    const started = await start.execute({ userId: userId.value })
    clock.advanceTo(new Date('2026-09-20T09:00:00.000Z'))
    await finish.execute({ userId: userId.value, sessionId: started.id.value })

    await expect(resume.execute({ userId: userId.value })).rejects.toThrow(
      WorkoutSessionNotFoundError,
    )
  })
})

describe('finishing a workout', () => {
  it('stamps the finish and closes the session', async () => {
    const finishedAt = new Date('2026-09-20T09:12:00.000Z')
    const started = await start.execute({ userId: userId.value })
    clock.advanceTo(finishedAt)

    const finished = await finish.execute({ userId: userId.value, sessionId: started.id.value })

    expect(finished.finishedOn).toEqual(finishedAt)
    expect(finished.isOpen).toBe(false)
  })

  it('refuses to finish twice', async () => {
    const started = await start.execute({ userId: userId.value })
    clock.advanceTo(new Date('2026-09-20T09:12:00.000Z'))
    await finish.execute({ userId: userId.value, sessionId: started.id.value })

    await expect(
      finish.execute({ userId: userId.value, sessionId: started.id.value }),
    ).rejects.toThrow(WorkoutAlreadyFinishedError)
  })

  it("refuses to finish another user's workout", async () => {
    const started = await start.execute({ userId: userId.value })

    await expect(
      finish.execute({ userId: otherUserId, sessionId: started.id.value }),
    ).rejects.toThrow(WorkoutSessionNotFoundError)
  })
})
