import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { StalePreviewError } from '../application/stale-preview.error'

export interface SetChangeResponse {
  readonly setId: string
  readonly exerciseId: string
  readonly loggedAt: string
  readonly fromKilograms: number
  readonly toKilograms: number
}

export interface RecordChangeResponse {
  readonly exerciseId: string
  readonly fromKilograms: number
  readonly toKilograms: number
  readonly holderSetId: string
}

export interface RecomputePreviewResponse {
  readonly equipmentId: string
  readonly affectedSets: number
  readonly changes: readonly SetChangeResponse[]
  readonly records: readonly RecordChangeResponse[]
  readonly previewToken: string
}

export const previewRecompute = async (
  equipmentId: string,
  client: AxiosInstance = apiClient,
): Promise<RecomputePreviewResponse> => {
  const { data } = await client.post<RecomputePreviewResponse>(
    `/equipment/${equipmentId}/recompute/preview`,
  )
  return data
}

/** Apply exactly the change that was previewed; a 409 means the history moved underneath it. */
export const applyRecompute = async (
  equipmentId: string,
  previewToken: string,
  client: AxiosInstance = apiClient,
): Promise<RecomputePreviewResponse> => {
  try {
    const { data } = await client.post<RecomputePreviewResponse>(
      `/equipment/${equipmentId}/recompute/apply`,
      { previewToken },
    )
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      throw new StalePreviewError()
    }
    throw error
  }
}
