import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { getSessionSets } from './session-sets.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })
  return { client, stub }
}

describe('getSessionSets', () => {
  it('reads what the workout has logged on the server', async () => {
    const set = {
      id: 's-1',
      sessionId: 'w-1',
      exerciseId: 'e-1',
      equipmentId: 'q-1',
      mode: 'TOTAL',
      reps: 5,
      loggedAt: '2026-10-04T09:05:00.000Z',
      resolvedGrams: 60000,
      stackPosition: null,
    }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: [set] }))

    expect(await getSessionSets('w-1', client)).toEqual([set])
    expect(stub.calls[0]?.url).toBe('/workouts/w-1/sets')
  })
})
