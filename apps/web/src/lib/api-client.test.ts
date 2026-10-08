import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createApiClient,
  redirectToSignIn,
  requireApiUrl,
  setSignInNavigator,
} from './api-client.ts'
import { stubAdapter } from './testing/stub-adapter.ts'

const clientAnswering = (status: number) => {
  let signalled = 0
  const stub = stubAdapter(() => ({ status, data: { ok: true } }))
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => (signalled += 1),
  })

  return { client, stub, signalled: () => signalled }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  setSignInNavigator(undefined)
})

describe('createApiClient', () => {
  it('sends every request to the API with the session cookie', async () => {
    const { client, stub } = clientAnswering(200)

    await client.get('/workouts/current')

    expect(stub.calls[0]?.baseURL).toBe('https://api.test')
    expect(stub.calls[0]?.url).toBe('/workouts/current')
    expect(stub.calls[0]?.withCredentials).toBe(true)
  })

  it('signals a lapsed session on 401 and still rejects', async () => {
    const { client, signalled } = clientAnswering(401)

    await expect(client.get('/workouts/current')).rejects.toThrow('401')
    expect(signalled()).toBe(1)
  })

  it('leaves a 401 alone when the request says it is an answer', async () => {
    const { client, signalled } = clientAnswering(401)

    await expect(client.post('/auth/sign-in', {}, { skipSignInRedirect: true })).rejects.toThrow(
      '401',
    )
    expect(signalled()).toBe(0)
  })

  it.each([404, 409, 500])('stays quiet on %i', async (status) => {
    const { client, signalled } = clientAnswering(status)

    await expect(client.get('/x')).rejects.toThrow(String(status))
    expect(signalled()).toBe(0)
  })

  it('does not swallow a network failure', async () => {
    const client = createApiClient({
      baseURL: 'https://api.test',
      adapter: async () => {
        throw new TypeError('Failed to fetch')
      },
      onUnauthenticated: () => {},
    })

    await expect(client.get('/x')).rejects.toThrow('Failed to fetch')
  })
})

describe('requireApiUrl', () => {
  it('returns the configured address', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.gym.test')

    expect(requireApiUrl()).toBe('https://api.gym.test')
  })

  it('refuses to run without one', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '')

    expect(() => requireApiUrl()).toThrow('NEXT_PUBLIC_API_URL')
  })
})

describe('redirectToSignIn', () => {
  const stubLocation = (pathname: string, search = '') => {
    const assign = vi.fn()
    vi.stubGlobal('window', { location: { pathname, search, assign } })
    return assign
  }

  it('navigates to sign-in, remembering where the user was', () => {
    const assign = stubLocation('/statistics', '?week=2')

    redirectToSignIn()

    expect(assign).toHaveBeenCalledWith('/sign-in?next=%2Fstatistics%3Fweek%3D2')
  })

  it('stays put on the sign-in page itself', () => {
    const assign = stubLocation('/sign-in')

    redirectToSignIn()

    expect(assign).not.toHaveBeenCalled()
  })

  it('does nothing outside the browser', () => {
    expect(() => redirectToSignIn()).not.toThrow()
  })

  it("goes through the app's router once it has one, so the page is not loaded again", () => {
    const assign = stubLocation('/', '')
    const navigate = vi.fn()
    setSignInNavigator(navigate)

    redirectToSignIn()

    expect(navigate).toHaveBeenCalledWith('/sign-in?next=%2F')
    expect(assign).not.toHaveBeenCalled()
  })

  it('falls back to a full navigation once the router is gone', () => {
    const assign = stubLocation('/', '')
    const navigate = vi.fn()
    setSignInNavigator(navigate)
    setSignInNavigator(undefined)

    redirectToSignIn()

    expect(navigate).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/sign-in?next=%2F')
  })
})
