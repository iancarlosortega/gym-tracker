import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { correctSet, deleteSet } from './sets.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })
  return { client, stub }
}

describe('correctSet', () => {
  it('patches the set with the new values and reads back the set', async () => {
    const set = { id: 's-1', reps: 10, resolvedGrams: 70000, rawGrams: 25000, revision: 1 }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: set }))

    expect(await correctSet('s-1', { grams: 25000, reps: 10 }, client)).toEqual(set)
    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/sets/s-1')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({ grams: 25000, reps: 10 })
  })
})

describe('deleteSet', () => {
  it('deletes the set', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 204 }))

    await deleteSet('s-1', client)

    expect(stub.calls[0]?.method).toBe('delete')
    expect(stub.calls[0]?.url).toBe('/sets/s-1')
  })

  it('takes a set that is already gone as deleted', async () => {
    const { client } = clientAnswering(() => ({ status: 404 }))

    await expect(deleteSet('s-1', client)).resolves.toBeUndefined()
  })

  it('still fails when the server cannot be reached', async () => {
    const { client } = clientAnswering(() => ({ status: 503 }))

    await expect(deleteSet('s-1', client)).rejects.toThrow('503')
  })
})
