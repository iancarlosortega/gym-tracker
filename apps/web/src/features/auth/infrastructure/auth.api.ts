import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'

/** Who is signed in, as the API describes them. */
export interface MeResponse {
  readonly id: string
  readonly email: string
  readonly displayUnit: string
}

export const getMe = async (client: AxiosInstance = apiClient): Promise<MeResponse> => {
  const { data } = await client.get<MeResponse>('/auth/me')
  return data
}

/**
 * End the session on the server.
 *
 * A 401 means the session had already lapsed, which is the outcome being
 * asked for, so it settles — and it skips the sign-in redirect, because the
 * caller decides where to go next.
 */
export const signOut = async (client: AxiosInstance = apiClient): Promise<void> => {
  try {
    await client.post('/auth/sign-out', undefined, { skipSignInRedirect: true })
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return
    }
    throw error
  }
}
