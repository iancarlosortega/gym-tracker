import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { getLastSets } from './last-sets.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const last = {
  sessionStartedAt: '2026-09-28T09:00:00.000Z',
  sets: [{ setNumber: 1, mode: 'TOTAL', value: 60, reps: 5 }],
}

describe('getLastSets', () => {
  it('reads last time, leaving out the session being logged', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: last }))

    expect(await getLastSets('e-1', 's-open', client)).toEqual(last)
    expect(stub.calls[0]?.url).toBe('/exercises/e-1/last-sets')
    expect(stub.calls[0]?.params).toEqual({ excludingSession: 's-open' })
  })

  it('reads an empty answer as never done: the server sends no body for null', async () => {
    const { client } = clientAnswering(() => ({ status: 200, data: '' }))

    expect(await getLastSets('e-1', null, client)).toBeNull()
  })

  it('asks without a session when nothing is open', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: null }))

    await getLastSets('e-1', null, client)

    expect(stub.calls[0]?.params).toEqual({})
  })
})
