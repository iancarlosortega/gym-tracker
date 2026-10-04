import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'
import type { ExerciseResponse, PageResponse } from '../../workouts/infrastructure/workouts.api'

export interface NewExercise {
  readonly name: string
  /** Fixed for the life of the exercise: changing it would reinterpret every set logged. */
  readonly defaultMode: MeasurementMode
}

/** Archived ones included: the catalog is where they can still be seen. */
export const getCatalogExercises = async (
  client: AxiosInstance = apiClient,
): Promise<readonly ExerciseResponse[]> => {
  const { data } = await client.get<PageResponse<ExerciseResponse>>(
    '/exercises?limit=200&includeArchived=true',
  )
  return data.items
}

export const createExercise = async (
  exercise: NewExercise,
  client: AxiosInstance = apiClient,
): Promise<ExerciseResponse> => {
  const { data } = await client.post<ExerciseResponse>('/exercises', exercise)
  return data
}

export const renameExercise = async (
  exerciseId: string,
  name: string,
  client: AxiosInstance = apiClient,
): Promise<ExerciseResponse> => {
  const { data } = await client.patch<ExerciseResponse>(`/exercises/${exerciseId}`, { name })
  return data
}

export const archiveExercise = async (
  exerciseId: string,
  client: AxiosInstance = apiClient,
): Promise<ExerciseResponse> => {
  const { data } = await client.post<ExerciseResponse>(`/exercises/${exerciseId}/archive`)
  return data
}
