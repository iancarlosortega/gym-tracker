import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'

/** A logged set as the server describes it. */
export interface LoggedSetResponse {
  readonly id: string
  readonly sessionId: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly mode: string
  readonly reps: number
  readonly loggedAt: string
  /** Null for a pin position, which is not a mass. */
  readonly resolvedGrams: number | null
  readonly stackPosition: number | null
}

export const getSessionSets = async (
  sessionId: string,
  client: AxiosInstance = apiClient,
): Promise<readonly LoggedSetResponse[]> => {
  const { data } = await client.get<readonly LoggedSetResponse[]>(`/workouts/${sessionId}/sets`)
  return data
}
