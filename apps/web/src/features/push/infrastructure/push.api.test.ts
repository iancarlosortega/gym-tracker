import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import {
  cancelRestAlert,
  getPushState,
  registerPushSubscription,
  scheduleRestAlert,
} from './push.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

describe('push api', () => {
  it('reads the subscription state', async () => {
    const state = { publicKey: 'k', subscribed: true, invalidated: false }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: state }))

    expect(await getPushState(client)).toEqual(state)
    expect(stub.calls[0]?.url).toBe('/push-subscriptions/state')
  })

  it('registers a subscription', async () => {
    const subscription = { endpoint: 'https://push.test/1', p256dh: 'p', auth: 'a' }
    const { client, stub } = clientAnswering(() => ({ status: 201 }))

    await registerPushSubscription(subscription, client)

    expect(stub.calls[0]?.url).toBe('/push-subscriptions')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual(subscription)
  })

  it('books a rest alert for the instant the rest ends', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201 }))

    await scheduleRestAlert('set-1', new Date('2026-10-04T10:03:00.000Z'), client)

    expect(stub.calls[0]?.url).toBe('/rest-alerts')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({
      setId: 'set-1',
      fireAt: '2026-10-04T10:03:00.000Z',
    })
  })

  it('cancels a rest alert', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 204 }))

    await cancelRestAlert('set-1', client)

    expect(stub.calls[0]?.method).toBe('delete')
    expect(stub.calls[0]?.url).toBe('/rest-alerts/set-1')
  })
})
