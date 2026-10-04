import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

/**
 * One retry, a second apart: a failure reaches the screen in about two seconds
 * instead of the seven the library's three backed-off retries take — long
 * enough to ride out a blip, short enough not to leave a lifter staring at a
 * loader between sets.
 */
const MAX_RETRIES = 1
const RETRY_DELAY_MS = 1000

/** A 401 already sent the user to sign in; asking again would only repeat it. */
export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  !(isAxiosError(error) && error.response?.status === 401) && failureCount < MAX_RETRIES

/**
 * Reads stay fresh for 30 seconds, so moving between screens reuses them, and
 * are refreshed when the app comes back to the foreground — a phone at the
 * gym is backgrounded between almost every set.
 */
export const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
        retryDelay: RETRY_DELAY_MS,
      },
    },
  })
