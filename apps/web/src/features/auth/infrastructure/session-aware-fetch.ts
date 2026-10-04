import { signInPathFor } from '../application/sign-in-redirect'

/**
 * Wraps a fetch so that a 401 sends the user to sign in.
 *
 * Every gateway talks to the API through one of these, which is what keeps the
 * "your session lapsed" answer in one place instead of in every page. The
 * response is still returned: the caller's own failure handling runs as it
 * always did, for the moment before the navigation lands.
 */
export const withSignInRedirect =
  (inner: typeof fetch, onUnauthenticated: () => void): typeof fetch =>
  async (input, init) => {
    const response = await inner(input, init)

    if (response.status === 401) {
      onUnauthenticated()
    }
    return response
  }

/**
 * Browser only: a server render has no cookie to lose and no page to leave.
 * A full navigation rather than the router's, so nothing signed-in stays cached.
 */
const redirectToSignIn = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  const { pathname, search } = window.location

  if (pathname === '/sign-in') {
    return
  }
  window.location.assign(signInPathFor(`${pathname}${search}`))
}

/** `globalThis.fetch` is read per call so a test or polyfill can replace it. */
export const sessionAwareFetch: typeof fetch = async (input, init) =>
  await withSignInRedirect(globalThis.fetch, redirectToSignIn)(input, init)
