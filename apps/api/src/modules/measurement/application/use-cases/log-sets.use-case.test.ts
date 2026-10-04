import { User } from '@gym/domain/auth/entities/user.entity'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import {
  EquipmentCannotMeasureThatWayError,
  ExerciseNotFoundError,
  StackPositionOutOfRangeError,
} from '@gym/domain/catalog/errors'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import {
  WorkoutAlreadyFinishedError,
  WorkoutSessionNotFoundError,
} from '@gym/domain/workouts/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryUserRepository } from '../../../auth/testing/in-memory-auth.ts'
import { InMemoryEquipmentRepository } from '../../../catalog/testing/in-memory-equipment.repository.ts'
import { InMemoryExerciseRepository } from '../../../catalog/testing/in-memory-exercise.repository.ts'
import { InMemoryWorkoutSessionRepository } from '../../../workouts/testing/in-memory-workout-session.repository.ts'
import { InMemorySetRepository } from '../../testing/in-memory-set.repository.ts'
import { LogSetsUseCase } from './log-sets.use-case.ts'

const startedAt = new Date('2026-09-20T08:00:00.000Z')
const loggedAt = new Date('2026-09-20T08:14:00.000Z')

let sets: InMemorySetRepository
let sessions: InMemoryWorkoutSessionRepository
let exercises: InMemoryExerciseRepository
let equipment: InMemoryEquipmentRepository
let users: InMemoryUserRepository
let logSets: LogSetsUseCase

let userId: string
let session: WorkoutSession
let sessionId: string
let benchId: string
let barbellId: string
let pulldownId: string
let stackId: string

beforeEach(async () => {
  sets = new InMemorySetRepository()
  sessions = new InMemoryWorkoutSessionRepository()
  exercises = new InMemoryExerciseRepository()
  equipment = new InMemoryEquipmentRepository()
  users = new InMemoryUserRepository()
  logSets = new LogSetsUseCase(sets, sessions, exercises, equipment, users)

  const user = User.create({
    email: 'ian@example.com',
    passwordHash: PasswordHash.create('$argon2id$v=19$m=1,t=1,p=1$c2FsdA$aGFzaA'),
    displayUnit: 'KG',
  })
  await users.save(user)
  userId = user.id.value

  session = WorkoutSession.start({ userId: user.id, startedAt })
  await sessions.save(session)
  sessionId = session.id.value

  const bench = Exercise.create({ userId: user.id, name: 'Bench press', defaultMode: 'PER_SIDE' })
  const pulldown = Exercise.create({
    userId: user.id,
    name: 'Lat pulldown',
    defaultMode: 'STACK_POSITION',
  })
  await exercises.save(bench)
  await exercises.save(pulldown)
  benchId = bench.id.value
  pulldownId = pulldown.id.value

  const barbell = Equipment.create({
    userId: user.id,
    name: 'Olympic bar',
    kind: 'BARBELL',
    barGrams: fromKilograms(20),
  })
  const stack = Equipment.create({
    userId: user.id,
    name: 'Pulldown machine',
    kind: 'STACK',
    stackPositions: 12,
  })
  await equipment.save(barbell)
  await equipment.save(stack)
  barbellId = barbell.id.value
  stackId = stack.id.value
})

function perSideSet(overrides: Partial<{ id: string; grams: number; reps: number }> = {}) {
  return {
    id: Id.create().value,
    exerciseId: benchId,
    equipmentId: barbellId,
    grams: fromKilograms(20),
    reps: 8,
    loggedAt,
    ...overrides,
  }
}

describe('logging sets', () => {
  it('resolves a per-side set against the bar it was lifted on', async () => {
    const [logged] = await logSets.execute({ userId, sessionId, sets: [perSideSet()] })

    // 20 kg a side on a 20 kg bar is 60 kg.
    expect(logged?.mass()).toEqual({ kind: 'resolved', grams: fromKilograms(60) })
  })

  it('snapshots the bar weight and the display unit at log time', async () => {
    const [logged] = await logSets.execute({ userId, sessionId, sets: [perSideSet()] })

    expect(logged?.snapshot.barGrams).toBe(fromKilograms(20))
    expect(logged?.snapshot.displayUnit).toBe('KG')
  })

  it('records an ordinal set without inventing a mass for it', async () => {
    const [logged] = await logSets.execute({
      userId,
      sessionId,
      sets: [
        {
          id: Id.create().value,
          exerciseId: pulldownId,
          equipmentId: stackId,
          position: 7,
          reps: 10,
          loggedAt,
        },
      ],
    })

    expect(logged?.mass().kind).toBe('not-applicable')
    expect(logged?.countsTowardsMassAggregate()).toBe(false)
    expect(logged?.snapshot.barGrams).toBeNull()
  })

  it('logs a whole batch in one call, which is what a drained queue looks like', async () => {
    const batch = [perSideSet(), perSideSet(), perSideSet()]

    await logSets.execute({ userId, sessionId, sets: batch })

    expect(sets.sets.size).toBe(3)
  })

  it('stores exactly one set when the same one is delivered twice', async () => {
    const replayed = perSideSet()

    await logSets.execute({ userId, sessionId, sets: [replayed] })
    await logSets.execute({ userId, sessionId, sets: [replayed] })

    expect(sets.sets.size).toBe(1)
    expect(await sets.findOne(Criteria.create({ id: replayed.id }))).not.toBeNull()
  })
})

describe('sets that arrive after the workout finished', () => {
  it('stores a set logged before the finish, delivered late from the offline queue', async () => {
    await sessions.save(session.finishedAt(new Date('2026-09-20T09:00:00.000Z')))

    await logSets.execute({ userId, sessionId, sets: [perSideSet()] })

    expect(sets.sets.size).toBe(1)
  })

  it('stores a set logged at the very instant the workout finished', async () => {
    const finishedAt = new Date('2026-09-20T09:00:00.000Z')
    await sessions.save(session.finishedAt(finishedAt))

    await logSets.execute({ userId, sessionId, sets: [{ ...perSideSet(), loggedAt: finishedAt }] })

    expect(sets.sets.size).toBe(1)
  })
})

describe('refusing a set', () => {
  it('refuses a session belonging to someone else', async () => {
    await expect(
      logSets.execute({ userId: Id.create().value, sessionId, sets: [perSideSet()] }),
    ).rejects.toThrow(WorkoutSessionNotFoundError)
  })

  it('refuses a set logged after the workout finished', async () => {
    await sessions.save(session.finishedAt(new Date('2026-09-20T09:00:00.000Z')))

    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [{ ...perSideSet(), loggedAt: new Date('2026-09-20T09:01:00.000Z') }],
      }),
    ).rejects.toThrow(WorkoutAlreadyFinishedError)
  })

  it('writes nothing when one set in a late batch was logged after the finish', async () => {
    await sessions.save(session.finishedAt(new Date('2026-09-20T09:00:00.000Z')))

    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [perSideSet(), { ...perSideSet(), loggedAt: new Date('2026-09-20T09:01:00.000Z') }],
      }),
    ).rejects.toThrow(WorkoutAlreadyFinishedError)
    expect(sets.sets.size).toBe(0)
  })

  it('refuses an exercise the user does not own', async () => {
    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [
          perSideSet({ id: Id.create().value }),
          { ...perSideSet(), exerciseId: Id.create().value },
        ],
      }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })

  it('refuses equipment that cannot express how the exercise is measured', async () => {
    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [{ ...perSideSet(), equipmentId: stackId }],
      }),
    ).rejects.toThrow(EquipmentCannotMeasureThatWayError)
  })

  it('refuses a pin position the machine does not have', async () => {
    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [
          {
            id: Id.create().value,
            exerciseId: pulldownId,
            equipmentId: stackId,
            position: 13,
            reps: 10,
            loggedAt,
          },
        ],
      }),
    ).rejects.toThrow(StackPositionOutOfRangeError)
  })

  it('writes nothing when one set in the batch is rejected', async () => {
    await expect(
      logSets.execute({
        userId,
        sessionId,
        sets: [perSideSet(), { ...perSideSet(), exerciseId: Id.create().value }],
      }),
    ).rejects.toThrow(ExerciseNotFoundError)

    expect(sets.sets.size).toBe(0)
  })
})
