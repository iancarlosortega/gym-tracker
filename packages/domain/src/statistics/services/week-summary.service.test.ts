import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'
import { weekSummary } from '@domain/statistics/services/week-summary.service.js'
import { WorkoutSession } from '@domain/workouts/entities/workout-session.entity.js'
import { describe, expect, it } from 'vitest'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

const lastWeek = new Date('2026-09-09T10:00:00.000Z')
const thisWeek = new Date('2026-09-16T10:00:00.000Z')

const userId = Id.create()
const routineId = Id.create()
const routineSessionId = Id.create().value
const adHocSessionId = Id.create().value

const routineSession = WorkoutSession.restore({
  id: Id.restore(routineSessionId),
  userId,
  routineId,
  startedAt: thisWeek,
  finishedOn: null,
})

const adHocSession = WorkoutSession.restore({
  id: Id.restore(adHocSessionId),
  userId,
  routineId: null,
  startedAt: thisWeek,
  finishedOn: null,
})

const setIn = (
  sessionId: string,
  entry: LoadEntry,
  loggedAt: Date,
  exerciseId = 'bench',
  repetitions = 8,
): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId,
    exerciseId,
    equipmentId: 'equipment',
    entry,
    reps: reps(repetitions),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: 'equipment' },
  })

const bar = (kilograms: number) => LoadEntry.total(fromKilograms(kilograms))
const pin = (position: number) => LoadEntry.stack(stackPosition(position))

describe('what the week did', () => {
  it('counts sets whatever scale measured them', () => {
    const summary = weekSummary({
      sets: [
        setIn(adHocSessionId, bar(60), thisWeek),
        setIn(adHocSessionId, pin(7), thisWeek, 'pulldown'),
      ],
      sessions: [adHocSession],
      plannedSetsByRoutine: new Map(),
      previousSets: [],
    })

    // The headline needs no exclusion notice, which is the point of using it.
    expect(summary.sets).toBe(2)
  })

  it('counts the workouts', () => {
    const summary = weekSummary({
      sets: [],
      sessions: [routineSession, adHocSession],
      plannedSetsByRoutine: new Map(),
      previousSets: [],
    })

    expect(summary.workouts).toBe(2)
  })
})

describe('how much of the plan was done', () => {
  it('counts only the sets logged into routine-led sessions', () => {
    const summary = weekSummary({
      sets: [
        setIn(routineSessionId, bar(60), thisWeek),
        setIn(routineSessionId, bar(60), thisWeek),
        setIn(adHocSessionId, bar(60), thisWeek),
      ],
      sessions: [routineSession, adHocSession],
      plannedSetsByRoutine: new Map([[routineId.value, 6]]),
      previousSets: [],
    })

    expect(summary.plan).toEqual({ plannedSets: 6, completedSets: 2 })
  })

  it('has no plan at all for a week of ad hoc work', () => {
    const summary = weekSummary({
      sets: [setIn(adHocSessionId, bar(60), thisWeek)],
      sessions: [adHocSession],
      plannedSetsByRoutine: new Map(),
      previousSets: [],
    })

    // Null rather than 0/0: there was nothing to fall short of.
    expect(summary.plan).toBeNull()
  })
})

describe('which exercises moved', () => {
  const movementOf = (current: LoggedSet[], previous: LoggedSet[]) =>
    weekSummary({
      sets: current,
      sessions: [adHocSession],
      plannedSetsByRoutine: new Map(),
      previousSets: previous,
    }).movements

  it('counts more weight as up', () => {
    const movements = movementOf(
      [setIn(adHocSessionId, bar(65), thisWeek)],
      [setIn(adHocSessionId, bar(60), lastWeek)],
    )

    expect(movements).toEqual([{ exerciseId: 'bench', direction: 'up' }])
  })

  it('counts the same weight for more reps as up', () => {
    const movements = movementOf(
      [setIn(adHocSessionId, bar(60), thisWeek, 'bench', 10)],
      [setIn(adHocSessionId, bar(60), lastWeek, 'bench', 8)],
    )

    expect(movements).toEqual([{ exerciseId: 'bench', direction: 'up' }])
  })

  it('counts an identical week as held', () => {
    const movements = movementOf(
      [setIn(adHocSessionId, bar(60), thisWeek, 'bench', 8)],
      [setIn(adHocSessionId, bar(60), lastWeek, 'bench', 8)],
    )

    expect(movements).toEqual([{ exerciseId: 'bench', direction: 'held' }])
  })

  it('counts fewer reps at the same weight as down', () => {
    const movements = movementOf(
      [setIn(adHocSessionId, bar(60), thisWeek, 'bench', 6)],
      [setIn(adHocSessionId, bar(60), lastWeek, 'bench', 8)],
    )

    expect(movements).toEqual([{ exerciseId: 'bench', direction: 'down' }])
  })

  it('says nothing about an exercise that changed how it is measured', () => {
    const movements = movementOf(
      [setIn(adHocSessionId, bar(60), thisWeek, 'pulldown')],
      [setIn(adHocSessionId, pin(7), lastWeek, 'pulldown')],
    )

    // Positions and kilograms are different scales; no direction is honest.
    expect(movements).toEqual([])
  })

  it('says nothing about an exercise with no previous week', () => {
    expect(movementOf([setIn(adHocSessionId, bar(60), thisWeek)], [])).toEqual([])
  })
})
