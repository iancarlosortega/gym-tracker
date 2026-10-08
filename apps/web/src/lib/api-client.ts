import axios, { type AxiosAdapter, type AxiosInstance, isAxiosError } from 'axios'
import { SIGN_IN_PATH, signInPathFor } from '@/features/auth/application/sign-in-redirect'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** A 401 on this request is an answer, not a lapsed session. */
    skipSignInRedirect?: boolean
  }
}

export interface ApiClientOptions {
  readonly baseURL?: string
  /** Tests only: answers requests instead of the network. */
  readonly adapter?: AxiosAdapter
  readonly onUnauthenticated?: () => void
}

/**
 * The API's address, inlined by `next build`.
 *
 * Read as a literal `process.env.NEXT_PUBLIC_API_URL` because Next only
 * inlines that exact member access. Without it axios would resolve every path
 * against the page's own origin, which answers nothing useful — so the app
 * refuses to start rather than fail one request at a time.
 */
export const requireApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL

  if (url === undefined || url === '') {
    throw new Error('NEXT_PUBLIC_API_URL is not set, so the app has no server to talk to.')
  }
  return url
}

let navigateInApp: ((path: string) => void) | undefined

/**
 * The app's router, registered once it has hydrated. Through it the redirect
 * stays inside the page that is already loaded: a full navigation would load
 * the app again, and the installed app's launch would play a second time.
 */
export const setSignInNavigator = (navigate: ((path: string) => void) | undefined): void => {
  navigateInApp = navigate
}

/**
 * Browser only: a server render has no cookie to lose and no page to leave.
 * Before the router is registered, a full navigation is the only way there.
 * Data cached for the lapsed session is dropped when the next one begins.
 */
export const redirectToSignIn = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  const { pathname, search } = window.location

  if (pathname === SIGN_IN_PATH) {
    return
  }

  const target = signInPathFor(`${pathname}${search}`)
  if (navigateInApp === undefined) {
    window.location.assign(target)
    return
  }
  navigateInApp(target)
}

/**
 * One client for the whole app, so the "your session lapsed" answer lives in
 * one place. The error still rejects after the redirect: the caller's own
 * failure handling runs for the moment before the navigation lands.
 */
export const createApiClient = ({
  baseURL = requireApiUrl(),
  adapter,
  onUnauthenticated = redirectToSignIn,
}: ApiClientOptions = {}): AxiosInstance => {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    ...(adapter === undefined ? {} : { adapter }),
  })

  client.interceptors.response.use(undefined, (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.skipSignInRedirect !== true
    ) {
      onUnauthenticated()
    }
    return Promise.reject(error)
  })

  return client
}

export const apiClient = createApiClient()
