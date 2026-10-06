import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryWorkoutHistoryRepository } from '../../testing/in-memory-workout-history.repository.ts'
import { ListWorkoutsUseCase } from './list-workouts.use-case.ts'

const owner = Id.create().value

let history: InMemoryWorkoutHistoryRepository
let list: ListWorkoutsUseCase

const entry = (day: number, userId = owner) => ({
  userId,
  id: Id.create().value,
  routineId: null,
  routineName: null,
  startedAt: new Date(Date.UTC(2026, 8, day, 8)),
  finishedAt: null,
  setCount: 0,
})

beforeEach(() => {
  history = new InMemoryWorkoutHistoryRepository()
  list = new ListWorkoutsUseCase(history)
})

describe('listing past workouts', () => {
  it('answers a page, newest first, and where the next one starts', async () => {
    history.entries.push(entry(1), entry(3), entry(2))

    const result = await list.execute({ userId: owner, limit: 2 })

    expect(result.items.map((item) => item.startedAt.getUTCDate())).toEqual([3, 2])
    expect(result.nextOffset).toBe(2)
  })

  it('has no next page after the last one', async () => {
    history.entries.push(entry(1), entry(2))

    const result = await list.execute({ userId: owner, limit: 2, offset: 0 })

    expect(result.nextOffset).toBeNull()
  })

  it('only reads the caller’s workouts', async () => {
    history.entries.push(entry(1, Id.create().value))

    expect((await list.execute({ userId: owner })).items).toEqual([])
  })
})
