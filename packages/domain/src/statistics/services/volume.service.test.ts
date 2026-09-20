import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { averageLoad, totalVolume } from '@domain/statistics/services/volume.service.js'
import { describe, expect, it } from 'vitest'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

const totalSet = (kilograms: number, repetitions: number): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId: 'exercise',
    equipmentId: 'equipment',
    entry: LoadEntry.total(fromKilograms(kilograms)),
    reps: reps(repetitions),
    loggedAt: new Date('2026-09-20T08:00:00.000Z'),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'equipment' },
  })

const plateSet = (position: number, repetitions: number): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId: 'machine',
    equipmentId: 'stack',
    entry: LoadEntry.stack(stackPosition(position)),
    reps: reps(repetitions),
    loggedAt: new Date('2026-09-20T08:00:00.000Z'),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'stack' },
  })

describe('total volume', () => {
  it('counts only the sets that have a mass', () => {
    const week = [
      totalSet(60, 5),
      totalSet(60, 5),
      plateSet(7, 12),
      plateSet(8, 10),
      plateSet(9, 8),
    ]

    const volume = totalVolume(week)

    // 60 kg × 5, twice. The three plate sets contribute nothing.
    expect(volume).toMatchObject({ kind: 'resolved', grams: fromKilograms(600), includedSets: 2 })
  })

  it('says how many sets it had to leave out', () => {
    const volume = totalVolume([totalSet(60, 5), plateSet(7, 12), plateSet(8, 10)])

    expect(volume.excludedSets).toBe(2)
  })

  it('refuses to call a week of plate work zero', () => {
    const volume = totalVolume([plateSet(7, 12), plateSet(8, 10)])

    expect(volume.kind).toBe('not-applicable')
    expect(volume.excludedSets).toBe(2)
  })

  it('distinguishes a week of plate work from a week of nothing', () => {
    const plateOnly = totalVolume([plateSet(7, 12)])
    const empty = totalVolume([])

    expect(plateOnly.kind).toBe('not-applicable')
    expect(empty.kind).toBe('not-applicable')
    expect(plateOnly).not.toEqual(empty)
  })

  it('multiplies by repetitions, not by set count', () => {
    expect(totalVolume([totalSet(100, 3)])).toMatchObject({ grams: fromKilograms(300) })
  })
})

describe('average load', () => {
  it('ignores ordinal sets and reports how many it ignored', () => {
    const average = averageLoad([totalSet(60, 5), totalSet(100, 1), plateSet(7, 12)])

    // The average of 60 and 100, unweighted by repetitions.
    expect(average).toMatchObject({ kind: 'resolved', grams: fromKilograms(80), excludedSets: 1 })
  })

  it('is not applicable when nothing had a mass', () => {
    expect(averageLoad([plateSet(7, 12)]).kind).toBe('not-applicable')
  })
})
