import type { WorkoutHistoryEntry } from '@gym/domain/workouts/repositories/workout-history.repository'

export interface WorkoutHistoryEntryView {
  readonly id: string
  readonly routineId: string | null
  readonly routineName: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly setCount: number
}

export const toWorkoutHistoryEntryView = (entry: WorkoutHistoryEntry): WorkoutHistoryEntryView => ({
  ...entry,
  startedAt: entry.startedAt.toISOString(),
  finishedAt: entry.finishedAt?.toISOString() ?? null,
})
