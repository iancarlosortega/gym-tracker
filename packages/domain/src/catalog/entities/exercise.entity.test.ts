import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'
import { Exercise } from './exercise.entity.ts'

const userId = Id.restore('0199a1f0-0000-7000-8000-00000000e001')

function benchPress() {
  return Exercise.create({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
}

describe('creating an exercise', () => {
  it('takes primitives and assembles itself', () => {
    const exercise = benchPress()

    expect(exercise.name.value).toBe('Bench Press')
    expect(exercise.defaultMode).toBe('PER_SIDE')
    expect(exercise.id.value).toMatch(/^[0-9a-f-]{36}$/)
    expect(exercise.userId.equals(userId)).toBe(true)
  })

  it('requires a measurement mode, because a set cannot be logged without one', () => {
    expect(() =>
      Exercise.create({ userId, name: 'Mystery', defaultMode: 'NEWTONS' as never }),
    ).toThrow(/mode/i)
  })

  it('rejects an empty name', () => {
    expect(() => Exercise.create({ userId, name: '  ', defaultMode: 'TOTAL' })).toThrow(/name/i)
  })

  it('starts unarchived', () => {
    expect(benchPress().isArchived).toBe(false)
  })
})

describe('changing an exercise', () => {
  it('renames by returning a new instance', () => {
    const exercise = benchPress()
    const renamed = exercise.renamedTo('Barbell Bench Press')

    expect(renamed.name.value).toBe('Barbell Bench Press')
    expect(exercise.name.value).toBe('Bench Press')
    expect(renamed.equals(exercise)).toBe(true)
  })

  it('archives at a given instant without mutating the original', () => {
    const exercise = benchPress()
    const archived = exercise.archivedAt(new Date('2026-09-19T12:00:00.000Z'))

    expect(archived.isArchived).toBe(true)
    expect(exercise.isArchived).toBe(false)
  })

  it('can be restored to active use', () => {
    const archived = benchPress().archivedAt(new Date('2026-09-19T12:00:00.000Z'))

    expect(archived.unarchived().isArchived).toBe(false)
  })

  it('keeps its identity through every change, so logged sets still point at it', () => {
    const exercise = benchPress()
    const changed = exercise.renamedTo('Something Else').archivedAt(new Date())

    expect(changed.id.equals(exercise.id)).toBe(true)
  })

  it('refuses to change the measurement mode once sets may exist under it', () => {
    expect('changeMode' in benchPress()).toBe(false)
  })
})
