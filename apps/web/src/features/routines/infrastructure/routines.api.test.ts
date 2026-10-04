import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import {
  addRoutineExercise,
  archiveRoutine,
  changeRoutineEntry,
  createRoutine,
  getRoutine,
  getRoutines,
  removeRoutineEntry,
  renameRoutine,
  reorderRoutine,
} from './routines.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const legs = { id: 'r-1', name: 'Legs', archived: false, entries: [] }
const body = (call: { data?: unknown } | undefined) => JSON.parse(String(call?.data))

describe('reading routines', () => {
  it('unwraps the page of routines', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: { items: [legs] } }))

    expect(await getRoutines(client)).toEqual([legs])
    expect(stub.calls[0]?.url).toBe('/routines?limit=200')
  })

  it('reads one routine', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: legs }))

    expect(await getRoutine('r-1', client)).toEqual(legs)
    expect(stub.calls[0]?.url).toBe('/routines/r-1')
  })

  it('fails when the routine cannot be read', async () => {
    const { client } = clientAnswering(() => ({ status: 404 }))

    await expect(getRoutine('r-9', client)).rejects.toThrow('404')
  })
})

describe('writing routines', () => {
  it('creates with a name', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: legs }))

    expect(await createRoutine('Legs', client)).toEqual(legs)
    expect(stub.calls[0]?.url).toBe('/routines')
    expect(body(stub.calls[0])).toEqual({ name: 'Legs' })
  })

  it('renames', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: legs }))

    await renameRoutine('r-1', 'Leg day', client)

    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/routines/r-1')
    expect(body(stub.calls[0])).toEqual({ name: 'Leg day' })
  })

  it('archives', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: legs }))

    await archiveRoutine('r-1', client)

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/routines/r-1/archive')
  })
})

describe('editing a routine’s entries', () => {
  it('adds an exercise with its targets', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: legs }))

    await addRoutineExercise(
      'r-1',
      { exerciseId: 'e-1', targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, restSeconds: 180 },
      client,
    )

    expect(stub.calls[0]?.url).toBe('/routines/r-1/exercises')
    expect(body(stub.calls[0])).toEqual({
      exerciseId: 'e-1',
      targetSets: 4,
      targetRepsMin: 6,
      targetRepsMax: 8,
      restSeconds: 180,
    })
  })

  it('changes one entry', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: legs }))

    await changeRoutineEntry('r-1', 'n-1', { targetSets: 3, restSeconds: 90 }, client)

    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/routines/r-1/exercises/n-1')
    expect(body(stub.calls[0])).toEqual({ targetSets: 3, restSeconds: 90 })
  })

  it('removes one entry', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: legs }))

    await removeRoutineEntry('r-1', 'n-1', client)

    expect(stub.calls[0]?.method).toBe('delete')
    expect(stub.calls[0]?.url).toBe('/routines/r-1/exercises/n-1')
  })

  it('sends the whole new order', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: legs }))

    await reorderRoutine('r-1', ['n-2', 'n-1'], client)

    expect(stub.calls[0]?.method).toBe('put')
    expect(stub.calls[0]?.url).toBe('/routines/r-1/order')
    expect(body(stub.calls[0])).toEqual({ entryIds: ['n-2', 'n-1'] })
  })
})
