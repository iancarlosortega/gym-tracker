import { describe, expect, it } from 'vitest'
import { withSignInRedirect } from './session-aware-fetch.ts'

const answering =
  (status: number): typeof fetch =>
  async () =>
    new Response(null, { status })

describe('withSignInRedirect', () => {
  it('signals a lapsed session on 401 and still returns the response', async () => {
    let signalled = 0
    const wrapped = withSignInRedirect(answering(401), () => (signalled += 1))

    const response = await wrapped('http://api/workouts/current')

    expect(signalled).toBe(1)
    expect(response.status).toBe(401)
  })

  it.each([200, 404, 409, 500])('stays quiet on %i', async (status) => {
    let signalled = 0

    await withSignInRedirect(answering(status), () => (signalled += 1))('http://api/x')

    expect(signalled).toBe(0)
  })

  it('does not swallow a network failure', async () => {
    const dead: typeof fetch = async () => {
      throw new TypeError('Failed to fetch')
    }

    await expect(withSignInRedirect(dead, () => {})('http://api/x')).rejects.toThrow(
      'Failed to fetch',
    )
  })
})
