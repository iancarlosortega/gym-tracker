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

/** The targets an entry can carry; each one is optional, as the API's are. */
export interface EntryTargets {
  readonly targetSets?: number
  readonly targetRepsMin?: number
  readonly targetRepsMax?: number
  readonly restSeconds?: number
}

export const addRoutineExercise = async (
  routineId: string,
  entry: EntryTargets & { readonly exerciseId: string },
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.post<RoutineResponse>(`/routines/${routineId}/exercises`, entry)
  return data
}

export const changeRoutineEntry = async (
  routineId: string,
  entryId: string,
  targets: EntryTargets,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.patch<RoutineResponse>(
    `/routines/${routineId}/exercises/${entryId}`,
    targets,
  )
  return data
}

/** Past sets of that exercise are untouched: only the plan changes. */
export const removeRoutineEntry = async (
  routineId: string,
  entryId: string,
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.delete<RoutineResponse>(
    `/routines/${routineId}/exercises/${entryId}`,
  )
  return data
}

/** Every entry, exactly once: the API refuses a partial order rather than guess. */
export const reorderRoutine = async (
  routineId: string,
  entryIds: readonly string[],
  client: AxiosInstance = apiClient,
): Promise<RoutineResponse> => {
  const { data } = await client.put<RoutineResponse>(`/routines/${routineId}/order`, { entryIds })
  return data
}
