import { describe, expect, it } from 'vitest'
import { InvalidCredentialsError } from '../application/invalid-credentials.error.ts'
import { HttpSignInGateway } from './http-sign-in.gateway.ts'

const answering =
  (status: number, calls: { url: string; init: RequestInit | undefined }[] = []): typeof fetch =>
  async (input, init) => {
    calls.push({ url: String(input), init })
    return new Response(null, { status })
  }

const credentials = { email: 'ian@example.com', password: 'secret' }

describe('HttpSignInGateway', () => {
  it('posts the credentials with the cookie jar enabled', async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = []

    await new HttpSignInGateway('http://api', answering(204, calls)).signIn(credentials)

    expect(calls[0]?.url).toBe('http://api/auth/sign-in')
    expect(calls[0]?.init?.method).toBe('POST')
    expect(calls[0]?.init?.credentials).toBe('include')
    expect(calls[0]?.init?.body).toBe(JSON.stringify(credentials))
  })

  it('maps a 401 to invalid credentials', async () => {
    await expect(
      new HttpSignInGateway('http://api', answering(401)).signIn(credentials),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('reports any other refusal as a plain failure, not as a wrong password', async () => {
    const attempt = new HttpSignInGateway('http://api', answering(500)).signIn(credentials)

    await expect(attempt).rejects.toThrow('The server answered 500.')
    await expect(attempt).rejects.not.toBeInstanceOf(InvalidCredentialsError)
  })

  it('lets a dead connection throw as it is', async () => {
    const dead: typeof fetch = async () => {
      throw new TypeError('Failed to fetch')
    }

    await expect(new HttpSignInGateway('http://api', dead).signIn(credentials)).rejects.toThrow(
      'Failed to fetch',
    )
  })
})
