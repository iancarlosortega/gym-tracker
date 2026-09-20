import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import {
  type ProgressionPoint,
  progression,
  startOfWeek,
  weekOverWeek,
} from '@domain/statistics/services/progression.service.js'
import { describe, expect, it } from 'vitest'

/** Narrows a point the test has just arranged to exist. */
const asPoint = (point: ProgressionPoint | undefined): ProgressionPoint => {
  if (point === undefined) {
    throw new Error('The test arranged a point that is not there.')
  }
  return point
}

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

const week1 = new Date('2026-09-07T10:00:00.000Z')
const week2 = new Date('2026-09-14T10:00:00.000Z')
const week3 = new Date('2026-09-21T10:00:00.000Z')

const setOf = (
  entry: LoadEntry,
  loggedAt: Date,
  exerciseId = 'pulldown',
  repetitions = 10,
): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId,
    equipmentId: 'equipment',
    entry,
    reps: reps(repetitions),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'equipment' },
  })

const plateAt = (position: number, loggedAt: Date, repetitions = 10) =>
  setOf(LoadEntry.stack(stackPosition(position)), loggedAt, 'pulldown', repetitions)

const barAt = (kilograms: number, loggedAt: Date, repetitions = 10) =>
  setOf(LoadEntry.total(fromKilograms(kilograms)), loggedAt, 'pulldown', repetitions)

describe('startOfWeek', () => {
  it('starts on Monday, the week a lifter thinks in', () => {
    // 2026-09-20 is a Sunday; its week began on the 14th.
    expect(startOfWeek(new Date('2026-09-20T23:00:00.000Z'))).toEqual(
      new Date('2026-09-14T00:00:00.000Z'),
    )
  })
})

describe('progression for an ordinal exercise', () => {
  it('reports the positions themselves, labelled as positions', () => {
    const result = progression('pulldown', [
      plateAt(5, week1),
      plateAt(6, week2),
      plateAt(7, week3),
    ])

    const [series] = result.series
    expect(series?.unit).toBe('position')
    expect(series?.points.map((point) => point.best)).toEqual([5, 6, 7])
  })

  it('never converts a position into a mass', () => {
    const [series] = progression('pulldown', [plateAt(7, week1)]).series

    expect(series?.unit).not.toBe('grams')
    expect(series?.points[0]?.best).toBe(7)
  })
})

describe('progression for a mass exercise', () => {
  it('reports the best set of each week, not the average', () => {
    const result = progression('pulldown', [barAt(60, week1), barAt(80, week1), barAt(70, week2)])

    const [series] = result.series
    expect(series?.unit).toBe('grams')
    expect(series?.points.map((point) => point.best)).toEqual([
      fromKilograms(80),
      fromKilograms(70),
    ])
  })

  it('counts the sets behind each week', () => {
    const [series] = progression('pulldown', [barAt(60, week1), barAt(80, week1)]).series

    expect(series?.points[0]?.sets).toBe(2)
  })
})

describe('an exercise that changed how it is measured', () => {
  const changed = [plateAt(7, week1), barAt(60, week2)]

  it('reports the change rather than drawing through it', () => {
    const result = progression('pulldown', changed)

    expect(result.modeChanges).toHaveLength(1)
    expect(result.modeChanges[0]).toMatchObject({ from: 'STACK_POSITION', to: 'TOTAL' })
  })

  it('keeps each mode in its own series, so no line crosses the units', () => {
    const result = progression('pulldown', changed)

    expect(result.series).toHaveLength(2)
    expect(result.series.map((series) => series.unit).sort()).toEqual(['grams', 'position'])
  })

  it('reports nothing when the mode never changed', () => {
    expect(progression('pulldown', [plateAt(5, week1), plateAt(6, week2)]).modeChanges).toEqual([])
  })
})

describe('scoping', () => {
  it('ignores sets belonging to another exercise', () => {
    const result = progression('pulldown', [
      plateAt(7, week1),
      setOf(LoadEntry.total(fromKilograms(100)), week1, 'bench'),
    ])

    expect(result.series).toHaveLength(1)
    expect(result.series[0]?.unit).toBe('position')
  })
})

describe('progress measured in repetitions', () => {
  it('carries the repetitions of the set that represents the week', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 8), barAt(60, week1, 5)]).series

    // The heavier set wins; between equal loads, the one with more reps does.
    expect(series?.points[0]).toMatchObject({ best: fromKilograms(60), reps: 8 })
  })

  it('prefers the heavier set even when a lighter one had more reps', () => {
    const [series] = progression('pulldown', [barAt(80, week1, 3), barAt(60, week1, 12)]).series

    expect(series?.points[0]).toMatchObject({ best: fromKilograms(80), reps: 3 })
  })

  it('sees the same weight for more reps as progress', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 8), barAt(60, week2, 10)]).series
    const [first, second] = series?.points ?? []

    expect(weekOverWeek(first, asPoint(second))).toEqual({ kind: 'improved', by: 'reps' })
  })

  it('sees more weight as progress whatever the reps did', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 10), barAt(65, week2, 6)]).series
    const [first, second] = series?.points ?? []

    expect(weekOverWeek(first, asPoint(second))).toEqual({ kind: 'improved', by: 'load' })
  })

  it('sees fewer reps at the same weight as a decline', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 10), barAt(60, week2, 8)]).series
    const [first, second] = series?.points ?? []

    expect(weekOverWeek(first, asPoint(second))).toEqual({ kind: 'declined' })
  })

  it('sees an identical week as held', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 10), barAt(60, week2, 10)]).series
    const [first, second] = series?.points ?? []

    expect(weekOverWeek(first, asPoint(second))).toEqual({ kind: 'held' })
  })

  it('measures an ordinal exercise the same way, on its own scale', () => {
    // A machine at the same pin for more reps is a stronger week too.
    const [series] = progression('pulldown', [plateAt(7, week1, 10), plateAt(7, week2, 12)]).series
    const [first, second] = series?.points ?? []

    expect(weekOverWeek(first, asPoint(second))).toEqual({ kind: 'improved', by: 'reps' })
  })

  it('holds when there is nothing before it to compare against', () => {
    const [series] = progression('pulldown', [barAt(60, week1, 10)]).series

    expect(weekOverWeek(undefined, asPoint(series?.points[0]))).toEqual({ kind: 'held' })
  })
})
