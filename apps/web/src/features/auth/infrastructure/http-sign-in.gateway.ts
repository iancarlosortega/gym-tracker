import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { InvalidCredentialsError } from '../application/invalid-credentials.error'
import type { Credentials, SignInPort } from '../application/sign-in.port'

/**
 * Signs in against the API. The answer is a Set-Cookie, which the client's
 * `withCredentials` lets the browser keep across the API's subdomain.
 *
 * The request opts out of the sign-in redirect: a 401 here is the answer to
 * the question, not a lapsed session, and redirecting to the page the user is
 * already on would loop.
 */
export class HttpSignInGateway implements SignInPort {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  async signIn(credentials: Credentials): Promise<void> {
    try {
      await this.client.post('/auth/sign-in', credentials, { skipSignInRedirect: true })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        throw new InvalidCredentialsError()
      }
      throw error
    }
  }
}
