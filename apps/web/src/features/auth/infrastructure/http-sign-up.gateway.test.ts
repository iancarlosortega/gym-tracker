import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { EmailTakenError } from '../application/email-taken.error.ts'
import { RateLimitedError } from '../application/rate-limited.error.ts'
import { SignUpRejectedError } from '../application/sign-up-rejected.error.ts'
import { HttpSignUpGateway } from './http-sign-up.gateway.ts'

const credentials = { email: 'new@example.com', password: 'correct horse' }

const gatewayAnswering = (answer: () => StubAnswer) => {
  let signalled = 0
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => (signalled += 1),
  })

  return { gateway: new HttpSignUpGateway(client), stub, signalled: () => signalled }
}

describe('HttpSignUpGateway', () => {
  it('posts the credentials to the sign-up route', async () => {
    const { gateway, stub } = gatewayAnswering(() => ({ status: 201 }))

    await gateway.signUp(credentials)

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/auth/sign-up')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual(credentials)
  })

  it('maps a 409 to a taken email', async () => {
    const { gateway } = gatewayAnswering(() => ({ status: 409 }))

    await expect(gateway.signUp(credentials)).rejects.toBeInstanceOf(EmailTakenError)
  })

  it("maps a 400 to a rejection carrying the server's reason", async () => {
    const { gateway } = gatewayAnswering(() => ({
      status: 400,
      data: { message: 'A password needs 8 to 512 characters.' },
    }))

    const attempt = gateway.signUp(credentials)

    await expect(attempt).rejects.toBeInstanceOf(SignUpRejectedError)
    await expect(attempt).rejects.toThrow('A password needs 8 to 512 characters.')
  })

  it('maps a 429 to rate limited', async () => {
    const { gateway } = gatewayAnswering(() => ({ status: 429 }))

    await expect(gateway.signUp(credentials)).rejects.toBeInstanceOf(RateLimitedError)
  })

  it('never treats a refusal as a lapsed session', async () => {
    const { gateway, signalled } = gatewayAnswering(() => ({ status: 401 }))

    await expect(gateway.signUp(credentials)).rejects.toThrow()
    expect(signalled()).toBe(0)
  })

  it('reports any other failure as it is', async () => {
    const { gateway } = gatewayAnswering(() => ({ status: 500 }))

    await expect(gateway.signUp(credentials)).rejects.toThrow('500')
  })
})
