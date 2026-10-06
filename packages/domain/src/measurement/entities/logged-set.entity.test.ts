import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { LoadCorrectionMismatchError, SnapshotMismatchError } from '@domain/measurement/errors.js'
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

  it('accepts a PER_SIDE set that counts no bar, when its snapshot agrees', () => {
    const smith = LoggedSet.create({
      ...benchPressProps,
      entry: LoadEntry.perSide(fromKilograms(20), null),
      snapshot: { ...benchPressProps.snapshot, barGrams: null },
    })

    expect(smith.mass()).toEqual({ kind: 'resolved', grams: 40_000 })
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

describe('correcting a logged set', () => {
  const totalProps = {
    ...benchPressProps,
    id: '0199a1f0-0000-7000-8000-000000000003',
    entry: LoadEntry.total(fromKilograms(60)),
    snapshot: { ...benchPressProps.snapshot, barGrams: null },
  }

  it('re-enters a total load and the reps as a new revision', () => {
    const original = LoggedSet.create(totalProps)
    const corrected = original.correct({ load: { grams: fromKilograms(62.5) }, reps: reps(10) })

    expect(corrected.mass()).toEqual({ kind: 'resolved', grams: 62_500 })
    expect(corrected.reps).toBe(10)
    expect(corrected.revision).toBe(original.revision + 1)
    expect(original.mass()).toEqual({ kind: 'resolved', grams: 60_000 })
  })

  it('resolves a per-side load against the bar it was logged with', () => {
    const corrected = LoggedSet.create(benchPressProps).correct({
      load: { grams: fromKilograms(25) },
      reps: reps(8),
    })

    expect(corrected.mass()).toEqual({ kind: 'resolved', grams: 70_000 })
    expect(corrected.snapshot.barGrams).toBe(fromKilograms(20))
  })

  it('counts no bar when the per-side set was logged without one', () => {
    const smith = LoggedSet.create({
      ...benchPressProps,
      entry: LoadEntry.perSide(fromKilograms(20), null),
      snapshot: { ...benchPressProps.snapshot, barGrams: null },
    })

    const corrected = smith.correct({ load: { grams: fromKilograms(30) }, reps: reps(8) })

    expect(corrected.mass()).toEqual({ kind: 'resolved', grams: 60_000 })
  })

  it('moves a stack set to another position and still carries no mass', () => {
    const corrected = LoggedSet.create(machineRowProps).correct({
      load: { position: stackPosition(8) },
      reps: reps(12),
    })

    expect(corrected.entry.toJSON()).toEqual({ mode: 'STACK_POSITION', position: 8 })
    expect(corrected.mass().kind).toBe('not-applicable')
  })

  it('keeps everything that says how and when the set was logged', () => {
    const original = LoggedSet.create({
      ...benchPressProps,
      snapshot: { ...benchPressProps.snapshot, displayUnit: 'LB' as const },
    })
    const corrected = original.correct({ load: { grams: fromKilograms(25) }, reps: reps(6) })

    expect(corrected.id).toBe(original.id)
    expect(corrected.sessionId).toBe(original.sessionId)
    expect(corrected.exerciseId).toBe(original.exerciseId)
    expect(corrected.equipmentId).toBe(original.equipmentId)
    expect(corrected.loggedAt).toEqual(original.loggedAt)
    expect(corrected.snapshot).toEqual(original.snapshot)
  })

  it('refuses a position for a set measured in grams', () => {
    const set = LoggedSet.create(benchPressProps)

    expect(() => set.correct({ load: { position: stackPosition(3) }, reps: reps(8) })).toThrow(
      LoadCorrectionMismatchError,
    )
  })

  it('refuses grams for a set measured by stack position', () => {
    const set = LoggedSet.create(machineRowProps)

    expect(() => set.correct({ load: { grams: fromKilograms(40) }, reps: reps(8) })).toThrow(
      LoadCorrectionMismatchError,
    )
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
