import { describe, expect, it, vi } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { changeDisplayUnit, getMe, signOut } from './auth.api.ts'

const clientAnswering = (answer: () => StubAnswer, onUnauthenticated = () => {}) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated,
  })

  return { client, stub }
}

describe('getMe', () => {
  it('answers who is signed in', async () => {
    const me = { id: 'u-1', email: 'ian@example.com', displayUnit: 'KG' }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: me }))

    expect(await getMe(client)).toEqual(me)
    expect(stub.calls[0]?.url).toBe('/auth/me')
  })

  it('fails when the server cannot answer', async () => {
    const { client } = clientAnswering(() => ({ status: 500 }))

    await expect(getMe(client)).rejects.toThrow('500')
  })
})

describe('signOut', () => {
  it('ends the session on the server', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 204 }))

    await signOut(client)

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/auth/sign-out')
  })

  it('settles on a 401 without redirecting: the session was already gone', async () => {
    const onUnauthenticated = vi.fn()
    const { client } = clientAnswering(() => ({ status: 401 }), onUnauthenticated)

    await expect(signOut(client)).resolves.toBeUndefined()
    expect(onUnauthenticated).not.toHaveBeenCalled()
  })

  it('fails when the server cannot be reached, so the session is not left open unnoticed', async () => {
    const { client } = clientAnswering(() => ({ status: 503 }))

    await expect(signOut(client)).rejects.toThrow('503')
  })
})

describe('changeDisplayUnit', () => {
  it('asks the server to remember pounds', async () => {
    const me = { id: 'u-1', email: 'ian@example.com', displayUnit: 'LB' }
    const { client, stub } = clientAnswering(() => ({ status: 200, data: me }))

    expect(await changeDisplayUnit('LB', client)).toEqual(me)
    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/auth/me')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({ displayUnit: 'LB' })
  })
})
