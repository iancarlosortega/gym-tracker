import type { Credentials } from './sign-in.port'

/**
 * Creates an account and starts its session in one exchange.
 *
 * Like signing in, the session arrives as an HttpOnly cookie, so nothing is
 * returned.
 */
export interface SignUpPort {
  /** Rejects with EmailTakenError, SignUpRejectedError or RateLimitedError. */
  signUp(credentials: Credentials): Promise<void>
}
