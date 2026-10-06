import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryWorkoutHistoryRepository } from '../../testing/in-memory-workout-history.repository.ts'
import { GetWorkoutUseCase } from './get-workout.use-case.ts'

const owner = Id.create().value
const workoutId = Id.create().value

let history: InMemoryWorkoutHistoryRepository
let getWorkout: GetWorkoutUseCase

beforeEach(() => {
  history = new InMemoryWorkoutHistoryRepository()
  getWorkout = new GetWorkoutUseCase(history)
  history.entries.push({
    userId: owner,
    id: workoutId,
    routineId: null,
    routineName: 'Push day',
    startedAt: new Date('2026-10-01T18:10:00Z'),
    finishedAt: null,
    setCount: 14,
  })
})

describe('reading one workout', () => {
  it('answers the workout as history shows it', async () => {
    expect(await getWorkout.execute({ userId: owner, workoutId })).toMatchObject({
      routineName: 'Push day',
      setCount: 14,
    })
  })

  it('refuses someone else’s workout', async () => {
    await expect(
      getWorkout.execute({ userId: Id.create().value, workoutId }),
    ).rejects.toBeInstanceOf(WorkoutSessionNotFoundError)
  })
})
