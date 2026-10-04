import { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import {
  EquipmentCannotMeasureThatWayError,
  ExerciseNotFoundError,
} from '@gym/domain/catalog/errors'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { RoutineNotFoundError } from '@gym/domain/routines/errors'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import { FixedClock } from '../../../auth/testing/in-memory-auth.ts'
import { InMemoryEquipmentRepository } from '../../../catalog/testing/in-memory-equipment.repository.ts'
import { InMemoryExerciseRepository } from '../../../catalog/testing/in-memory-exercise.repository.ts'
import { InMemoryRoutineRepository } from '../../testing/in-memory-routine.repository.ts'
import { AddRoutineExerciseUseCase } from './add-routine-exercise.use-case.ts'
import { ArchiveRoutineUseCase } from './archive-routine.use-case.ts'
import { CreateRoutineUseCase } from './create-routine.use-case.ts'
import { ListRoutinesUseCase } from './list-routines.use-case.ts'
import { RemoveRoutineEntryUseCase } from './remove-routine-entry.use-case.ts'
import { ReorderRoutineUseCase } from './reorder-routine.use-case.ts'

const userId = Id.create()
const otherUserId = Id.create().value

let routines: InMemoryRoutineRepository
let exercises: InMemoryExerciseRepository
let equipment: InMemoryEquipmentRepository
let createRoutine: CreateRoutineUseCase
let addExercise: AddRoutineExerciseUseCase
let removeEntry: RemoveRoutineEntryUseCase
let reorder: ReorderRoutineUseCase
let archive: ArchiveRoutineUseCase
let list: ListRoutinesUseCase
let history: Map<string, Date>

let benchId: string
let rowId: string
let barbellId: string
let machineId: string

beforeEach(async () => {
  routines = new InMemoryRoutineRepository()
  exercises = new InMemoryExerciseRepository()
  equipment = new InMemoryEquipmentRepository()

  createRoutine = new CreateRoutineUseCase(routines)
  addExercise = new AddRoutineExerciseUseCase(routines, exercises, equipment)
  removeEntry = new RemoveRoutineEntryUseCase(routines)
  reorder = new ReorderRoutineUseCase(routines)
  archive = new ArchiveRoutineUseCase(routines, new FixedClock(new Date('2026-09-19T12:00:00Z')))
  history = new Map()
  list = new ListRoutinesUseCase(routines, { lastDoneAt: async () => history })

  const bench = Exercise.create({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
  const row = Exercise.create({ userId, name: 'Seated Row', defaultMode: 'STACK_POSITION' })
  await exercises.save(bench)
  await exercises.save(row)
  benchId = bench.id.value
  rowId = row.id.value

  const barbell = Equipment.create({
    userId,
    name: 'Olympic Bar',
    kind: 'BARBELL',
    barGrams: fromKilograms(20),
  })
  const machine = Equipment.create({
    userId,
    name: 'Row Machine',
    kind: 'STACK',
    stackPositions: 15,
  })
  await equipment.save(barbell)
  await equipment.save(machine)
  barbellId = barbell.id.value
  machineId = machine.id.value
})

async function pushDay() {
  return await createRoutine.execute({ userId: userId.value, name: 'Push Day' })
}

describe('building a routine', () => {
  it('appends exercises in the order they were added', async () => {
    const routine = await pushDay()

    await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: benchId,
    })
    const withTwo = await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: rowId,
    })

    expect(withTwo.entries.map((entry) => entry.position)).toEqual([1, 2])
    expect(withTwo.entries[0]?.exerciseId.value).toBe(benchId)
  })

  it('records a per-exercise rest duration', async () => {
    const routine = await pushDay()

    const updated = await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: benchId,
      restSeconds: 300,
    })

    expect(updated.entries[0]?.rest.value).toBe(300)
  })

  it('accepts equipment that can express how the exercise is measured', async () => {
    const routine = await pushDay()

    const updated = await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: benchId,
      equipmentId: barbellId,
    })

    expect(updated.entries[0]?.equipmentId?.value).toBe(barbellId)
  })

  it('refuses a machine for a per-side lift, which would produce uninterpretable sets', async () => {
    const routine = await pushDay()

    await expect(
      addExercise.execute({
        userId: userId.value,
        routineId: routine.id.value,
        exerciseId: benchId,
        equipmentId: machineId,
      }),
    ).rejects.toThrow(EquipmentCannotMeasureThatWayError)
  })

  it('refuses a barbell for a plate-counted exercise', async () => {
    const routine = await pushDay()

    await expect(
      addExercise.execute({
        userId: userId.value,
        routineId: routine.id.value,
        exerciseId: rowId,
        equipmentId: barbellId,
      }),
    ).rejects.toThrow(EquipmentCannotMeasureThatWayError)
  })

  it('refuses an exercise that does not exist', async () => {
    const routine = await pushDay()

    await expect(
      addExercise.execute({
        userId: userId.value,
        routineId: routine.id.value,
        exerciseId: Id.create().value,
      }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })

  it('refuses a routine belonging to someone else', async () => {
    const routine = await pushDay()

    await expect(
      addExercise.execute({
        userId: otherUserId,
        routineId: routine.id.value,
        exerciseId: benchId,
      }),
    ).rejects.toThrow(RoutineNotFoundError)
  })
})

describe('rearranging a routine', () => {
  it('closes the gap when an exercise is removed', async () => {
    const routine = await pushDay()
    await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: benchId,
    })
    const withTwo = await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: rowId,
    })

    const without = await removeEntry.execute({
      userId: userId.value,
      routineId: routine.id.value,
      entryId: withTwo.entries[0]?.id.value as string,
    })

    expect(without.entries.map((entry) => entry.position)).toEqual([1])
    expect(without.entries[0]?.exerciseId.value).toBe(rowId)
  })

  it('reorders to the order given', async () => {
    const routine = await pushDay()
    await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: benchId,
    })
    const withTwo = await addExercise.execute({
      userId: userId.value,
      routineId: routine.id.value,
      exerciseId: rowId,
    })

    const reordered = await reorder.execute({
      userId: userId.value,
      routineId: routine.id.value,
      entryIds: [withTwo.entries[1]?.id.value as string, withTwo.entries[0]?.id.value as string],
    })

    expect(reordered.entries[0]?.exerciseId.value).toBe(rowId)
  })
})

describe('listing routines', () => {
  it('hides archived routines and stays bounded', async () => {
    const routine = await pushDay()
    await createRoutine.execute({ userId: userId.value, name: 'Pull Day' })

    await archive.execute({ userId: userId.value, routineId: routine.id.value })

    const { page } = await list.execute({ userId: userId.value })

    expect(page.items.map((item) => item.name.value)).toEqual(['Pull Day'])
    expect(page.total).toBe(1)
    expect(page.limit).toBe(50)
  })

  it('says when each routine was last done and which one is up next', async () => {
    const push = await pushDay()
    const pull = await createRoutine.execute({ userId: userId.value, name: 'Pull Day' })
    history.set(push.id.value, new Date('2026-09-28T09:00:00Z'))
    history.set(pull.id.value, new Date('2026-09-21T09:00:00Z'))

    const listing = await list.execute({ userId: userId.value })

    expect(listing.lastDoneAt.get(push.id.value)).toEqual(new Date('2026-09-28T09:00:00Z'))
    expect(listing.upNextRoutineId).toBe(pull.id.value)
  })

  it('puts a never-done routine up next, breaking ties by the order the list shows', async () => {
    await pushDay()
    const legs = await createRoutine.execute({ userId: userId.value, name: 'Legs' })
    await createRoutine.execute({ userId: userId.value, name: 'Pull Day' })

    const listing = await list.execute({ userId: userId.value })

    expect(listing.upNextRoutineId).toBe(legs.id.value)
  })

  it('has nothing up next without routines', async () => {
    expect((await list.execute({ userId: userId.value })).upNextRoutineId).toBeNull()
  })
})
