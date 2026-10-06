import { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { StackPositionOutOfRangeError } from '@gym/domain/catalog/errors'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { LoadCorrectionMismatchError, SetNotFoundError } from '@gym/domain/measurement/errors'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryEquipmentRepository } from '../../../catalog/testing/in-memory-equipment.repository.ts'
import { InMemoryWorkoutSessionRepository } from '../../../workouts/testing/in-memory-workout-session.repository.ts'
import { InMemorySetRepository } from '../../testing/in-memory-set.repository.ts'
import { CorrectSetUseCase } from './correct-set.use-case.ts'

const owner = Id.create()
const loggedAt = new Date('2026-10-05T18:10:00Z')

let sets: InMemorySetRepository
let sessions: InMemoryWorkoutSessionRepository
let equipment: InMemoryEquipmentRepository
let correct: CorrectSetUseCase
let session: WorkoutSession
let barbell: Equipment
let stack: Equipment

beforeEach(async () => {
  sets = new InMemorySetRepository()
  sessions = new InMemoryWorkoutSessionRepository()
  equipment = new InMemoryEquipmentRepository()
  correct = new CorrectSetUseCase(sets, sessions, equipment)

  session = WorkoutSession.start({ userId: owner, startedAt: new Date('2026-10-05T18:00:00Z') })
  await sessions.save(session)

  barbell = Equipment.create({
    userId: owner,
    name: 'Olympic bar',
    kind: 'BARBELL',
    barGrams: fromKilograms(20),
  })
  stack = Equipment.create({ userId: owner, name: 'Leg curl', kind: 'STACK', stackPositions: 12 })
  await equipment.save(barbell)
  await equipment.save(stack)
})

async function benchSet(): Promise<LoggedSet> {
  const set = LoggedSet.create({
    id: Id.create().value,
    sessionId: session.id.value,
    exerciseId: Id.create().value,
    equipmentId: barbell.id.value,
    entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
    reps: reps(8),
    loggedAt,
    snapshot: { barGrams: fromKilograms(20), displayUnit: 'KG', equipmentId: barbell.id.value },
  })
  await sets.save(set)
  return set
}

async function curlSet(): Promise<LoggedSet> {
  const set = LoggedSet.create({
    id: Id.create().value,
    sessionId: session.id.value,
    exerciseId: Id.create().value,
    equipmentId: stack.id.value,
    entry: LoadEntry.stack(stackPosition(7)),
    reps: reps(10),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: stack.id.value },
  })
  await sets.save(set)
  return set
}

async function stored(id: string): Promise<LoggedSet | null> {
  return await sets.findOne(Criteria.create({ id }))
}

describe('correcting a logged set', () => {
  it('stores the new reps and load as the next revision', async () => {
    const set = await benchSet()

    const corrected = await correct.execute({
      userId: owner.value,
      setId: set.id,
      grams: fromKilograms(25),
      reps: 10,
    })

    expect(corrected.reps).toBe(10)
    expect(corrected.mass()).toEqual({ kind: 'resolved', grams: 70_000 })
    expect(corrected.revision).toBe(1)
    expect((await stored(set.id))?.reps).toBe(10)
  })

  it('resolves against the bar the set was logged with, not the bar as it is now', async () => {
    const set = await benchSet()
    await equipment.save(barbell.withBarWeight(fromKilograms(15)))

    const corrected = await correct.execute({
      userId: owner.value,
      setId: set.id,
      grams: fromKilograms(25),
      reps: 8,
    })

    expect(corrected.mass()).toEqual({ kind: 'resolved', grams: 70_000 })
    expect(corrected.snapshot.barGrams).toBe(fromKilograms(20))
  })

  it('moves a stack set to another position the machine has', async () => {
    const set = await curlSet()

    const corrected = await correct.execute({
      userId: owner.value,
      setId: set.id,
      position: 8,
      reps: 10,
    })

    expect(corrected.entry.toJSON()).toEqual({ mode: 'STACK_POSITION', position: 8 })
  })

  it('refuses a position the machine does not have, and keeps the set as it was', async () => {
    const set = await curlSet()

    await expect(
      correct.execute({ userId: owner.value, setId: set.id, position: 13, reps: 10 }),
    ).rejects.toBeInstanceOf(StackPositionOutOfRangeError)
    expect((await stored(set.id))?.entry.toJSON()).toEqual({
      mode: 'STACK_POSITION',
      position: 7,
    })
  })

  it('refuses a load of the wrong kind', async () => {
    const set = await benchSet()

    await expect(
      correct.execute({ userId: owner.value, setId: set.id, position: 3, reps: 8 }),
    ).rejects.toBeInstanceOf(LoadCorrectionMismatchError)
  })

  it('reports a set that does not exist as not found', async () => {
    await expect(
      correct.execute({ userId: owner.value, setId: Id.create().value, grams: 1000, reps: 5 }),
    ).rejects.toBeInstanceOf(SetNotFoundError)
  })

  it('reports someone else’s set as not found and leaves it alone', async () => {
    const set = await benchSet()

    await expect(
      correct.execute({ userId: Id.create().value, setId: set.id, grams: 1000, reps: 5 }),
    ).rejects.toBeInstanceOf(SetNotFoundError)
    expect((await stored(set.id))?.reps).toBe(8)
  })
})
