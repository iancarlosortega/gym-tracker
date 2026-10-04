import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'

export interface WeekSummaryResponse {
  readonly sets: number
  readonly workouts: number
  /** Null when no workout that week followed a routine. */
  readonly plan: { readonly plannedSets: number; readonly completedSets: number } | null
  readonly liftsUp: number
  readonly liftsHeld: number
  readonly liftsDown: number
}

export interface WeekComparisonResponse {
  readonly current: WeekSummaryResponse
  readonly previous: WeekSummaryResponse
}

export interface ProgressionPointResponse {
  readonly periodStart: string
  readonly value: number
  readonly reps: number
  readonly sets: number
  readonly change: 'improved-load' | 'improved-reps' | 'held' | 'declined'
}

export interface ProgressionSeriesResponse {
  readonly mode: string
  readonly unit: 'kilograms' | 'position'
  readonly points: readonly ProgressionPointResponse[]
}

export interface ExerciseProgressionResponse {
  readonly exerciseId: string
  readonly series: readonly ProgressionSeriesResponse[]
  readonly modeChanges: readonly {
    readonly at: string
    readonly from: string
    readonly to: string
  }[]
}

/* Statistics are read-only; nothing here writes. */

export const getWeekComparison = async (
  weekStart: Date,
  client: AxiosInstance = apiClient,
): Promise<WeekComparisonResponse> => {
  const { data } = await client.get<WeekComparisonResponse>('/statistics/week', {
    params: { weekStart: weekStart.toISOString() },
  })
  return data
}

export const getExerciseProgression = async (
  exerciseId: string,
  from: Date,
  to: Date,
  client: AxiosInstance = apiClient,
): Promise<ExerciseProgressionResponse> => {
  const { data } = await client.get<ExerciseProgressionResponse>(
    `/statistics/exercises/${exerciseId}/progression`,
    { params: { from: from.toISOString(), to: to.toISOString() } },
  )
  return data
}
