import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { SnapshotMismatchError } from '@domain/measurement/errors.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { describe, expect, it } from 'vitest'

const benchPressProps = {
  id: '0199a1f0-0000-7000-8000-000000000001',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  equipmentId: 'equipment-olympic-bar',
  entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
  reps: reps(8),
  loggedAt: new Date('2026-09-19T18:00:00.000Z'),
  snapshot: {
    barGrams: fromKilograms(20),
    displayUnit: 'KG' as const,
    equipmentId: 'equipment-olympic-bar',
  },
}

const machineRowProps = {
  ...benchPressProps,
  id: '0199a1f0-0000-7000-8000-000000000002',
  exerciseId: 'exercise-seated-row',
  equipmentId: 'equipment-row-machine',
  entry: LoadEntry.stack(stackPosition(7)),
  snapshot: { barGrams: null, displayUnit: 'KG' as const, equipmentId: 'equipment-row-machine' },
}

describe('creating a logged set', () => {
  it('exposes its state through getters only', () => {
    const set = LoggedSet.create(benchPressProps)

    expect(set.id).toBe(benchPressProps.id)
    expect(set.exerciseId).toBe('exercise-bench-press')
    expect(set.reps).toBe(8)
    expect(set.entry.mode).toBe('PER_SIDE')
  })

  it('cannot be mutated from outside', () => {
    const set = LoggedSet.create(benchPressProps)

    expect(() => {
      ;(set as unknown as { id: string }).id = 'tampered'
    }).toThrow()
    expect(set.id).toBe(benchPressProps.id)
  })

  it('does not alias the date it was given', () => {
    const loggedAt = new Date('2026-09-19T18:00:00.000Z')
    const set = LoggedSet.create({ ...benchPressProps, loggedAt })

    loggedAt.setFullYear(1999)

    expect(set.loggedAt.getFullYear()).toBe(2026)
  })

  it('rejects a PER_SIDE set whose snapshot bar weight contradicts its entry', () => {
    expect(() =>
      LoggedSet.create({
        ...benchPressProps,
        snapshot: { ...benchPressProps.snapshot, barGrams: fromKilograms(15) },
      }),
    ).toThrow(SnapshotMismatchError)
  })

  it('rejects a PER_SIDE set with no snapshot bar weight', () => {
    expect(() =>
      LoggedSet.create({
        ...benchPressProps,
        snapshot: { ...benchPressProps.snapshot, barGrams: null },
      }),
    ).toThrow(SnapshotMismatchError)
  })

  it('rejects an ordinal set that claims a bar weight', () => {
    expect(() =>
      LoggedSet.create({
        ...machineRowProps,
        snapshot: { ...machineRowProps.snapshot, barGrams: fromKilograms(20) },
      }),
    ).toThrow(SnapshotMismatchError)
  })
})

describe('domain behaviour', () => {
  it('resolves its own mass', () => {
    expect(LoggedSet.create(benchPressProps).mass()).toEqual({ kind: 'resolved', grams: 60_000 })
  })

  it('reports no mass for an ordinal set', () => {
    expect(LoggedSet.create(machineRowProps).mass().kind).toBe('not-applicable')
  })

  it('knows whether it counts towards a mass aggregate', () => {
    expect(LoggedSet.create(benchPressProps).countsTowardsMassAggregate()).toBe(true)
    expect(LoggedSet.create(machineRowProps).countsTowardsMassAggregate()).toBe(false)
  })

  it('is identified by id, not by its values', () => {
    const one = LoggedSet.create(benchPressProps)
    const sameIdDifferentReps = LoggedSet.create({ ...benchPressProps, reps: reps(12) })
    const differentId = LoggedSet.create({ ...benchPressProps, id: machineRowProps.id })

    expect(one.equals(sameIdDifferentReps)).toBe(true)
    expect(one.equals(differentId)).toBe(false)
  })

  it('corrects reps by returning a new instance, leaving the original untouched', () => {
    const original = LoggedSet.create(benchPressProps)
    const corrected = original.correctReps(reps(10))

    expect(corrected).not.toBe(original)
    expect(corrected.reps).toBe(10)
    expect(original.reps).toBe(8)
    expect(corrected.revision).toBe(original.revision + 1)
  })
})

describe('restoring from persistence', () => {
  it('keeps the stored revision instead of starting over', () => {
    const restored = LoggedSet.restore({ ...benchPressProps, revision: 4 })

    expect(restored.revision).toBe(4)
    expect(restored.id).toBe(benchPressProps.id)
  })

  it('starts a newly created set at revision zero', () => {
    expect(LoggedSet.create(benchPressProps).revision).toBe(0)
  })

  it('still refuses a structurally impossible row', () => {
    expect(() =>
      LoggedSet.restore({
        ...machineRowProps,
        revision: 2,
        snapshot: { ...machineRowProps.snapshot, barGrams: fromKilograms(20) },
      }),
    ).toThrow(SnapshotMismatchError)
  })
})
