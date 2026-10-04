import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'
import type { EquipmentResponse, PageResponse } from '../../workouts/infrastructure/workouts.api'

export interface EquipmentUsageResponse {
  readonly exercises: number
  readonly sets: number
}

/** Archived ones included: the catalog is where they can still be seen. */
export const getCatalogEquipment = async (
  client: AxiosInstance = apiClient,
): Promise<readonly EquipmentResponse[]> => {
  const { data } = await client.get<PageResponse<EquipmentResponse>>(
    '/equipment?limit=200&includeArchived=true',
  )
  return data.items
}

export const getEquipmentUsage = async (
  equipmentId: string,
  client: AxiosInstance = apiClient,
): Promise<EquipmentUsageResponse> => {
  const { data } = await client.get<EquipmentUsageResponse>(`/equipment/${equipmentId}/usage`)
  return data
}

export const renameEquipment = async (
  equipmentId: string,
  name: string,
  client: AxiosInstance = apiClient,
): Promise<EquipmentResponse> => {
  const { data } = await client.patch<EquipmentResponse>(`/equipment/${equipmentId}`, { name })
  return data
}

export const archiveEquipment = async (
  equipmentId: string,
  client: AxiosInstance = apiClient,
): Promise<EquipmentResponse> => {
  const { data } = await client.post<EquipmentResponse>(`/equipment/${equipmentId}/archive`)
  return data
}
