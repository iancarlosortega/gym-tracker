import { InvalidCredentialsError } from '../application/invalid-credentials.error'
import type { Credentials, SignInPort } from '../application/sign-in.port'

/**
 * Signs in against the API.
 *
 * Deliberately given the plain fetch, never the session-aware one: a 401 here
 * is the answer to the question, not a lapsed session, and redirecting to the
 * page the user is already on would loop.
 */
export class HttpSignInGateway implements SignInPort {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  async signIn(credentials: Credentials): Promise<void> {
    const response = await this.fetchImpl(`${this.baseUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The API answers with a Set-Cookie, and the page is on another origin.
      credentials: 'include',
      body: JSON.stringify(credentials),
    })

    if (response.status === 401) {
      throw new InvalidCredentialsError()
    }

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }
  }
}
