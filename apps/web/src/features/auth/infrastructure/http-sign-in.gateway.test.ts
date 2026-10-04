import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { InvalidCredentialsError } from '../application/invalid-credentials.error.ts'
import { HttpSignInGateway } from './http-sign-in.gateway.ts'

const credentials = { email: 'ian@example.com', password: 'secret' }

const gatewayAnswering = (answer: () => StubAnswer) => {
  let signalled = 0
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => (signalled += 1),
  })

  return { gateway: new HttpSignInGateway(client), stub, signalled: () => signalled }
}

describe('HttpSignInGateway', () => {
  it('posts the credentials to the sign-in route', async () => {
    const { gateway, stub } = gatewayAnswering(() => ({ status: 204 }))

    await gateway.signIn(credentials)

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/auth/sign-in')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual(credentials)
  })

  it('maps a 401 to invalid credentials without treating it as a lapsed session', async () => {
    const { gateway, signalled } = gatewayAnswering(() => ({ status: 401 }))

    await expect(gateway.signIn(credentials)).rejects.toBeInstanceOf(InvalidCredentialsError)
    expect(signalled()).toBe(0)
  })

  it('reports any other refusal as a plain failure, not as a wrong password', async () => {
    const { gateway } = gatewayAnswering(() => ({ status: 500 }))
    const attempt = gateway.signIn(credentials)

    await expect(attempt).rejects.toThrow('500')
    await expect(attempt).rejects.not.toBeInstanceOf(InvalidCredentialsError)
  })

  it('lets a dead connection throw as it is', async () => {
    const { gateway } = gatewayAnswering(() => {
      throw new TypeError('Failed to fetch')
    })

    await expect(gateway.signIn(credentials)).rejects.toThrow('Failed to fetch')
  })
})
