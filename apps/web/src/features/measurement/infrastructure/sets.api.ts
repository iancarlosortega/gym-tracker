import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import type { LoggedSetResponse } from './session-sets.api'

/** One kind of load: grams (per side for PER_SIDE) or a pin position. */
export type SetCorrectionRequest =
  | { readonly grams: number; readonly reps: number }
  | { readonly position: number; readonly reps: number }

export const correctSet = async (
  setId: string,
  correction: SetCorrectionRequest,
  client: AxiosInstance = apiClient,
): Promise<LoggedSetResponse> => {
  const { data } = await client.patch<LoggedSetResponse>(`/sets/${setId}`, correction)
  return data
}

/** A set already gone is what deleting it was for, so a 404 is not a failure here. */
export const deleteSet = async (
  setId: string,
  client: AxiosInstance = apiClient,
): Promise<void> => {
  try {
    await client.delete(`/sets/${setId}`)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return
    throw error
  }
}
