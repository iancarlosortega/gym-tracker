import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'
import type { PageResponse } from '../../workouts/infrastructure/workouts.api'

export interface RoutineEntryResponse {
  readonly id: string
  readonly exerciseId: string
  readonly equipmentId: string | null
  readonly position: number
  readonly targetSets: number | null
  /** "8-12" for a range, "8" for an exact target. */
  readonly targetReps: string | null
  readonly restSeconds: number
}

export interface RoutineResponse {
  readonly id: string
  readonly name: string
  readonly archived: boolean
  readonly entries: readonly RoutineEntryResponse[]
}

export const getRoutines = async (
  client: AxiosInstance = apiClient,
): Promise<readonly RoutineResponse[]> => {
  const { data } = await client.get<PageResponse<RoutineResponse>>('/routines?limit=200')
  return data.items
}

export const getRoutine = async (
  routineId: string,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.get<RoutineResponse>(`/routines/${routineId}`)
  return data
}

export const createRoutine = async (
  name: string,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.post<RoutineResponse>('/routines', { name })
  return data
}

export const renameRoutine = async (
  routineId: string,
  name: string,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.patch<RoutineResponse>(`/routines/${routineId}`, { name })
  return data
}

export const archiveRoutine = async (
  routineId: string,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.post<RoutineResponse>(`/routines/${routineId}/archive`)
  return data
}
