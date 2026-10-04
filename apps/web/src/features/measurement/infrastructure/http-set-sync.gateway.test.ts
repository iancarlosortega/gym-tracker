import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { HttpSetSyncGateway } from './http-set-sync.gateway.ts'

const gatewayAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { gateway: new HttpSetSyncGateway(client), stub }
}

describe('HttpSetSyncGateway', () => {
  it('posts the batch to the workout and returns the ids the server wrote', async () => {
    const { gateway, stub } = gatewayAnswering(() => ({
      status: 201,
      data: [{ id: 'set-1' }, { id: 'set-2' }],
    }))

    const written = await gateway.push('session-9', [])

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/workouts/session-9/sets')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({ sets: [] })
    expect(written).toEqual(['set-1', 'set-2'])
  })

  it('throws on a refusal, so the queue keeps the batch pending', async () => {
    const { gateway } = gatewayAnswering(() => ({ status: 503 }))

    await expect(gateway.push('session-9', [])).rejects.toThrow('503')
  })
})
