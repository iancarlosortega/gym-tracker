import { Id } from '@domain/shared/value-objects/id.vo.js'
import { WorkoutSession } from '@domain/workouts/entities/workout-session.entity.js'
import { InvalidWorkoutTimesError, WorkoutAlreadyFinishedError } from '@domain/workouts/errors.js'
import { describe, expect, it } from 'vitest'

const userId = Id.create()
const startedAt = new Date('2026-09-20T08:00:00.000Z')

describe('WorkoutSession', () => {
  it('starts open, so it can be resumed', () => {
    const session = WorkoutSession.start({ userId, startedAt })

    expect(session.isOpen).toBe(true)
    expect(session.isFinished).toBe(false)
    expect(session.finishedOn).toBeNull()
  })

  it('starts ad hoc without a routine', () => {
    expect(WorkoutSession.start({ userId, startedAt }).routineId).toBeNull()
  })

  it('keeps the routine it was started from as a reference', () => {
    const routineId = Id.create()

    const session = WorkoutSession.start({ userId, routineId, startedAt })

    expect(session.routineId?.value).toBe(routineId.value)
  })

  it('closes when finished', () => {
    const finishedAt = new Date('2026-09-20T09:12:00.000Z')

    const session = WorkoutSession.start({ userId, startedAt }).finishedAt(finishedAt)

    expect(session.isOpen).toBe(false)
    expect(session.finishedOn).toEqual(finishedAt)
  })

  it('refuses to finish twice', () => {
    const session = WorkoutSession.start({ userId, startedAt }).finishedAt(
      new Date('2026-09-20T09:12:00.000Z'),
    )

    expect(() => session.finishedAt(new Date('2026-09-20T09:30:00.000Z'))).toThrow(
      WorkoutAlreadyFinishedError,
    )
  })

  it('refuses to finish before it started', () => {
    const session = WorkoutSession.start({ userId, startedAt })

    expect(() => session.finishedAt(new Date('2026-09-20T07:59:59.000Z'))).toThrow(
      InvalidWorkoutTimesError,
    )
  })

  it('does not change when a caller mutates the date it was given', () => {
    const mutable = new Date(startedAt)
    const session = WorkoutSession.start({ userId, startedAt: mutable })

    mutable.setFullYear(1999)

    expect(session.startedAt).toEqual(startedAt)
  })
})
