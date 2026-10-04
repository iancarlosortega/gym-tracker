export interface Credentials {
  readonly email: string
  readonly password: string
}

/**
 * Exchanges credentials for a session.
 *
 * The session itself is an HttpOnly cookie the browser stores, so nothing is
 * returned: there is no token for the client to hold, and so none to leak.
 */
export interface SignInPort {
  /** Rejects with InvalidCredentialsError when the server refuses them. */
  signIn(credentials: Credentials): Promise<void>
}
