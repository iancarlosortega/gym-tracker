import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { deleteWorkout, getWorkout, getWorkoutHistory } from './history.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })
  return { client, stub }
}

describe('getWorkoutHistory', () => {
  it('reads a page of workouts', async () => {
    const page = { items: [], nextOffset: null }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: page }))

    expect(await getWorkoutHistory({ limit: 20, offset: 40 }, client)).toEqual(page)
    expect(stub.calls[0]?.url).toBe('/workouts')
    expect(stub.calls[0]?.params).toEqual({ limit: 20, offset: 40 })
  })

  it('sends a range as instants', async () => {
    const { client, stub } = clientAnswering(() => ({
      status: 200,
      data: { items: [], nextOffset: null },
    }))

    await getWorkoutHistory(
      {
        limit: 200,
        from: new Date('2026-10-01T05:00:00Z'),
        to: new Date('2026-11-01T05:00:00Z'),
      },
      client,
    )

    expect(stub.calls[0]?.params).toEqual({
      limit: 200,
      from: '2026-10-01T05:00:00.000Z',
      to: '2026-11-01T05:00:00.000Z',
    })
  })
})

describe('getWorkout', () => {
  it('reads one workout', async () => {
    const workout = { id: 'w-1', routineName: 'Push day', setCount: 14 }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: workout }))

    expect(await getWorkout('w-1', client)).toEqual(workout)
    expect(stub.calls[0]?.url).toBe('/workouts/w-1')
  })
})

describe('deleteWorkout', () => {
  it('deletes the workout', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 204 }))

    await deleteWorkout('w-1', client)

    expect(stub.calls[0]?.method).toBe('delete')
    expect(stub.calls[0]?.url).toBe('/workouts/w-1')
  })
})
