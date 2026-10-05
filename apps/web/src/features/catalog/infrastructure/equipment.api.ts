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

export type NewEquipment =
  /** No bar weight is a bar or sled that is not counted, as on a Smith. */
  | { readonly name: string; readonly kind: 'BARBELL'; readonly barKilograms?: number }
  | { readonly name: string; readonly kind: 'STACK'; readonly stackPositions: number }
  | { readonly name: string; readonly kind: 'FREE_WEIGHT' }

export const createEquipment = async (
  equipment: NewEquipment,
  client: AxiosInstance = apiClient,
): Promise<EquipmentResponse> => {
  const { data } = await client.post<EquipmentResponse>('/equipment', equipment)
  return data
}

/** A new bar weight in kilograms, or null to stop counting the bar. Past sets follow only through recompute. */
export const correctBarWeight = async (
  equipmentId: string,
  barKilograms: number | null,
  client: AxiosInstance = apiClient,
): Promise<EquipmentResponse> => {
  const { data } = await client.put<EquipmentResponse>(`/equipment/${equipmentId}/bar-weight`, {
    barKilograms,
  })
  return data
}
