import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { EmailTakenError } from '../application/email-taken.error'
import { RateLimitedError } from '../application/rate-limited.error'
import type { Credentials } from '../application/sign-in.port'
import type { SignUpPort } from '../application/sign-up.port'
import { SignUpRejectedError } from '../application/sign-up-rejected.error'

const UNUSABLE = 'That email or password cannot be used.'

/**
 * Registers against the API, which answers with the new session's cookie.
 *
 * Opts out of the sign-in redirect for the same reason sign-in does: nobody
 * signing up has a session to lose.
 */
export class HttpSignUpGateway implements SignUpPort {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  async signUp(credentials: Credentials): Promise<void> {
    try {
      await this.client.post('/auth/sign-up', credentials, { skipSignInRedirect: true })
    } catch (error) {
      if (!isAxiosError(error)) {
        throw error
      }
      switch (error.response?.status) {
        case 409:
          throw new EmailTakenError()
        case 400:
          throw new SignUpRejectedError(reasonFrom(error.response.data))
        case 429:
          throw new RateLimitedError()
        default:
          throw error
      }
    }
  }
}

const reasonFrom = (body: unknown): string => {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body
    if (typeof message === 'string') {
      return message
    }
  }
  return UNUSABLE
}
