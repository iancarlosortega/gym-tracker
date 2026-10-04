import { describe, expect, it } from 'vitest'
import type { WorkoutSessionResponse } from '../infrastructure/workouts.api.ts'
import { openWorkout } from './open-workout.ts'

const session: WorkoutSessionResponse = {
  id: '0199a1f0-0000-7000-8000-0000000000a1',
  routineId: null,
  startedAt: '2026-10-04T09:00:00.000Z',
  finishedAt: null,
  open: true,
}

describe('openWorkout', () => {
  it('is the session the server calls open', () => {
    expect(openWorkout(session, [])).toBe(session)
  })

  it('is nothing once the phone has finished it, even before the server hears', () => {
    const finish = { sessionId: session.id, finishedAt: new Date('2026-10-04T10:30:00.000Z') }

    expect(openWorkout(session, [finish])).toBeNull()
  })

  it('ignores a pending finish for some other workout', () => {
    const finish = { sessionId: 'another', finishedAt: new Date('2026-10-04T10:30:00.000Z') }

    expect(openWorkout(session, [finish])).toBe(session)
  })

  it('is nothing when nothing is in progress', () => {
    expect(openWorkout(null, [])).toBeNull()
  })
})
