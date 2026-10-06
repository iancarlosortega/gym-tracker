import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'

/** One workout as the history list shows it. Instants are ISO strings. */
export interface WorkoutHistoryEntry {
  readonly id: string
  readonly routineId: string | null
  /** Null for a workout started without a routine. */
  readonly routineName: string | null
  readonly startedAt: string
  /** Null while the workout is still open. */
  readonly finishedAt: string | null
  readonly setCount: number
}

export interface WorkoutHistoryPage {
  readonly items: readonly WorkoutHistoryEntry[]
  /** Where the next page starts, or null after the last one. */
  readonly nextOffset: number | null
}

export interface WorkoutHistoryWindow {
  readonly limit?: number
  readonly offset?: number
  /** Started at or after. */
  readonly from?: Date
  /** Started before. */
  readonly to?: Date
}

export const getWorkoutHistory = async (
  { limit, offset, from, to }: WorkoutHistoryWindow,
  client: AxiosInstance = apiClient,
): Promise<WorkoutHistoryPage> => {
  const { data } = await client.get<WorkoutHistoryPage>('/workouts', {
    params: {
      ...(limit === undefined ? {} : { limit }),
      ...(offset === undefined ? {} : { offset }),
      ...(from === undefined ? {} : { from: from.toISOString() }),
      ...(to === undefined ? {} : { to: to.toISOString() }),
    },
  })
  return data
}

export const deleteWorkout = async (
  workoutId: string,
  client: AxiosInstance = apiClient,
): Promise<void> => {
  await client.delete(`/workouts/${workoutId}`)
}
