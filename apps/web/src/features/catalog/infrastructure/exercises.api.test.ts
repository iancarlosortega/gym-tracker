import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import {
  archiveExercise,
  createExercise,
  getCatalogExercises,
  renameExercise,
} from './exercises.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const hipThrust = { id: 'e-1', name: 'Hip thrust', defaultMode: 'PER_SIDE', archived: false }
const body = (call: { data?: unknown } | undefined) => JSON.parse(String(call?.data))

describe('getCatalogExercises', () => {
  it('asks for archived exercises too, so the catalog can offer them', async () => {
    const archived = { ...hipThrust, id: 'e-2', archived: true }
    const { client, stub } = clientAnswering(() => ({
      status: 200,
      data: { items: [hipThrust, archived] },
    }))

    expect(await getCatalogExercises(client)).toEqual([hipThrust, archived])
    expect(stub.calls[0]?.url).toBe('/exercises?limit=200&includeArchived=true')
  })
})

describe('createExercise', () => {
  it('sends the name and how it is loaded', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: hipThrust }))

    expect(await createExercise({ name: 'Hip thrust', defaultMode: 'PER_SIDE' }, client)).toEqual(
      hipThrust,
    )
    expect(stub.calls[0]?.url).toBe('/exercises')
    expect(body(stub.calls[0])).toEqual({ name: 'Hip thrust', defaultMode: 'PER_SIDE' })
  })

  it('fails when the server refuses', async () => {
    const { client } = clientAnswering(() => ({ status: 400 }))

    await expect(createExercise({ name: '', defaultMode: 'TOTAL' }, client)).rejects.toThrow('400')
  })
})

describe('renameExercise', () => {
  it('sends only the new name', async () => {
    const renamed = { ...hipThrust, name: 'Barbell hip thrust' }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: renamed }))

    expect(await renameExercise('e-1', 'Barbell hip thrust', client)).toEqual(renamed)
    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/exercises/e-1')
    expect(body(stub.calls[0])).toEqual({ name: 'Barbell hip thrust' })
  })
})

describe('archiveExercise', () => {
  it('archives by id', async () => {
    const { client, stub } = clientAnswering(() => ({
      status: 201,
      data: { ...hipThrust, archived: true },
    }))

    expect((await archiveExercise('e-1', client)).archived).toBe(true)
    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/exercises/e-1/archive')
  })
})
