import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'

export interface LastSetsResponse {
  readonly sessionStartedAt: string
  readonly sets: readonly {
    readonly setNumber: number
    readonly mode: MeasurementMode
    /** As entered: total kilograms, kilograms per side, or the pin position. */
    readonly value: number
    readonly reps: number
  }[]
}

/** Null when the exercise was never done before; the server sends that as an empty body. */
export const getLastSets = async (
  exerciseId: string,
  excludingSession: string | null,
  client: AxiosInstance = apiClient,
): Promise<LastSetsResponse | null> => {
  const { data } = await client.get<LastSetsResponse | '' | null>(
    `/exercises/${exerciseId}/last-sets`,
    { params: excludingSession === null ? {} : { excludingSession } },
  )
  return data === '' || data === null ? null : data
}
