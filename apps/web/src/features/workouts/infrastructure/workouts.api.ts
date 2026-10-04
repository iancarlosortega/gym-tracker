import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'

/** The shape the API answers with; the client never rebuilds a domain entity from it. */
export interface WorkoutSessionResponse {
  readonly id: string
  readonly routineId: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly open: boolean
}

export interface ExerciseResponse {
  readonly id: string
  readonly name: string
  readonly defaultMode: MeasurementMode
  readonly archived: boolean
}

export interface EquipmentResponse {
  readonly id: string
  readonly name: string
  readonly kind: string
  /** Kilograms over the wire; grams are the domain's unit and stay inside it. */
  readonly barKilograms: number | null
  readonly stackPositions: number | null
  readonly archived: boolean
}

export interface PageResponse<TItem> {
  readonly items: readonly TItem[]
}

/*
 * Only reads and the session start live here. Set writes go through the queue
 * and drain through SetSyncGateway, because a write must work with the API
 * unreachable and a read has nothing useful to say without it.
 */

/** Null when nothing is in progress: the API answers 404 rather than a null body. */
export const getCurrentWorkout = async (
  client: AxiosInstance = apiClient,
): Promise<WorkoutSessionResponse | null> => {
  try {
    const { data } = await client.get<WorkoutSessionResponse>('/workouts/current')
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export const startWorkout = async (
  routineId?: string,
  client: AxiosInstance = apiClient,
): Promise<WorkoutSessionResponse> => {
  const { data } = await client.post<WorkoutSessionResponse>(
    '/workouts',
    routineId === undefined ? {} : { routineId },
  )
  return data
}

export const getExercises = async (
  client: AxiosInstance = apiClient,
): Promise<readonly ExerciseResponse[]> => {
  const { data } = await client.get<PageResponse<ExerciseResponse>>('/exercises?limit=200')
  return data.items
}

export const getEquipment = async (
  client: AxiosInstance = apiClient,
): Promise<readonly EquipmentResponse[]> => {
  const { data } = await client.get<PageResponse<EquipmentResponse>>('/equipment?limit=200')
  return data.items
}
