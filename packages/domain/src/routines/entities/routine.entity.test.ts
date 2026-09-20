import { RoutineEntryNotFoundError } from '@domain/routines/errors.js'
import { RestDuration } from '@domain/routines/value-objects/rest-duration.vo.js'
import { TargetReps } from '@domain/routines/value-objects/target-reps.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'
import { Routine } from './routine.entity.ts'

const userId = Id.restore('0199a1f0-0000-7000-8000-000000001001')
const bench = Id.restore('0199a1f0-0000-7000-8000-000000002001')
const squat = Id.restore('0199a1f0-0000-7000-8000-000000002002')
const row = Id.restore('0199a1f0-0000-7000-8000-000000002003')

function pushDay() {
  return Routine.create({ userId, name: 'Push Day' })
    .withExercise({ exerciseId: bench })
    .withExercise({ exerciseId: squat })
    .withExercise({ exerciseId: row })
}

describe('creating a routine', () => {
  it('starts empty and named', () => {
    const routine = Routine.create({ userId, name: '  Push Day ' })

    expect(routine.name.value).toBe('Push Day')
    expect(routine.entries).toEqual([])
  })

  it('rejects an empty name', () => {
    expect(() => Routine.create({ userId, name: '  ' })).toThrow(/name/i)
  })
})

describe('adding exercises', () => {
  it('appends in order, numbering positions from one', () => {
    const routine = pushDay()

    expect(routine.entries.map((entry) => entry.position)).toEqual([1, 2, 3])
    expect(routine.entries.map((entry) => entry.exerciseId.value)).toEqual([
      bench.value,
      squat.value,
      row.value,
    ])
  })

  it('defaults rest to three minutes, which is what a compound lift gets', () => {
    expect(pushDay().entries[0]?.rest.value).toBe(180)
  })

  it('accepts per-exercise rest, so an accessory can rest less', () => {
    const routine = Routine.create({ userId, name: 'Day' }).withExercise({
      exerciseId: bench,
      rest: RestDuration.create(90),
    })

    expect(routine.entries[0]?.rest.value).toBe(90)
  })

  it('allows the same exercise twice, because supersets and drop sets exist', () => {
    const routine = Routine.create({ userId, name: 'Day' })
      .withExercise({ exerciseId: bench })
      .withExercise({ exerciseId: bench })

    expect(routine.entries).toHaveLength(2)
  })

  it('does not mutate the routine it was added to', () => {
    const empty = Routine.create({ userId, name: 'Day' })
    empty.withExercise({ exerciseId: bench })

    expect(empty.entries).toEqual([])
  })
})

describe('removing an exercise', () => {
  it('closes the gap rather than leaving a hole in the order', () => {
    const routine = pushDay()
    const entryId = routine.entries[1]?.id as Id

    const without = routine.withoutEntry(entryId)

    expect(without.entries.map((entry) => entry.position)).toEqual([1, 2])
    expect(without.entries.map((entry) => entry.exerciseId.value)).toEqual([bench.value, row.value])
  })

  it('refuses an entry the routine does not have', () => {
    expect(() => pushDay().withoutEntry(Id.create())).toThrow(RoutineEntryNotFoundError)
  })
})

describe('reordering', () => {
  it('renumbers to the order given', () => {
    const routine = pushDay()
    const [first, second, third] = routine.entries

    const reordered = routine.reordered([third?.id as Id, first?.id as Id, second?.id as Id])

    expect(reordered.entries.map((entry) => entry.exerciseId.value)).toEqual([
      row.value,
      bench.value,
      squat.value,
    ])
    expect(reordered.entries.map((entry) => entry.position)).toEqual([1, 2, 3])
  })

  it('refuses an order that omits an entry, which would silently drop it', () => {
    const routine = pushDay()

    expect(() => routine.reordered([routine.entries[0]?.id as Id])).toThrow(/order/i)
  })

  it('refuses an order containing an entry twice', () => {
    const routine = pushDay()
    const first = routine.entries[0]?.id as Id

    expect(() => routine.reordered([first, first, routine.entries[2]?.id as Id])).toThrow(/order/i)
  })
})

describe('changing an entry', () => {
  it('updates targets and leaves the rest of the routine alone', () => {
    const routine = pushDay()
    const entryId = routine.entries[0]?.id as Id

    const updated = routine.withEntryChanged(entryId, {
      targetSets: 5,
      targetReps: TargetReps.create(3, 5),
      rest: RestDuration.create(300),
    })

    expect(updated.entries[0]?.targetSets).toBe(5)
    expect(updated.entries[0]?.targetReps?.toString()).toBe('3-5')
    expect(updated.entries[0]?.rest.value).toBe(300)
    expect(updated.entries[1]?.rest.value).toBe(180)
  })

  it('keeps identity so a completed session still refers to the same routine', () => {
    const routine = pushDay()
    const changed = routine.renamedTo('Upper Body').archivedAt(new Date())

    expect(changed.id.equals(routine.id)).toBe(true)
  })
})
