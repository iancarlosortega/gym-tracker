import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import {
  finishWorkout,
  getCurrentWorkout,
  getEquipment,
  getExercises,
  startWorkout,
} from './workouts.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const session = { id: 's-1', routineId: null, startedAt: '', finishedAt: null, open: true }

describe('getCurrentWorkout', () => {
  it('answers null when nothing is in progress: the API says 404, not a null body', async () => {
    const { client } = clientAnswering(() => ({ status: 404 }))

    expect(await getCurrentWorkout(client)).toBeNull()
  })

  it('answers the open session', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: session }))

    expect(await getCurrentWorkout(client)).toEqual(session)
    expect(stub.calls[0]?.url).toBe('/workouts/current')
  })

  it('still fails on any other refusal', async () => {
    const { client } = clientAnswering(() => ({ status: 500 }))

    await expect(getCurrentWorkout(client)).rejects.toThrow('500')
  })
})

describe('startWorkout', () => {
  it('sends the routine only when there is one', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: session }))

    await startWorkout(undefined, client)
    await startWorkout('r-1', client)

    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({})
    expect(JSON.parse(String(stub.calls[1]?.data))).toEqual({ routineId: 'r-1' })
  })
})

describe('catalogue reads', () => {
  it('unwraps the page of exercises', async () => {
    const exercise = { id: 'e-1', name: 'Squat', defaultMode: 'TOTAL', archived: false }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: { items: [exercise] } }))

    expect(await getExercises(client)).toEqual([exercise])
    expect(stub.calls[0]?.url).toBe('/exercises?limit=200')
  })

  it('unwraps the page of equipment', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: { items: [] } }))

    expect(await getEquipment(client)).toEqual([])
    expect(stub.calls[0]?.url).toBe('/equipment?limit=200')
  })
})

describe('finishWorkout', () => {
  const finishedAt = new Date('2026-10-04T10:30:00.000Z')

  it('sends the instant the user pressed finish', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: session }))

    await finishWorkout('s-1', finishedAt, client)

    expect(stub.calls[0]?.url).toBe('/workouts/s-1/finish')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({
      finishedAt: '2026-10-04T10:30:00.000Z',
    })
  })

  it('counts an already finished workout as delivered, so a replay settles', async () => {
    const { client } = clientAnswering(() => ({ status: 409 }))

    await expect(finishWorkout('s-1', finishedAt, client)).resolves.toBeUndefined()
  })

  it('still fails when the server could not take it', async () => {
    const { client } = clientAnswering(() => ({ status: 503 }))

    await expect(finishWorkout('s-1', finishedAt, client)).rejects.toThrow('503')
  })
})
