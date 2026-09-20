import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'

export interface WorkoutSessionView {
  readonly id: string
  readonly routineId: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly open: boolean
}

export function toWorkoutSessionView(model: WorkoutSession): WorkoutSessionView {
  return {
    id: model.id.value,
    routineId: model.routineId?.value ?? null,
    startedAt: model.startedAt.toISOString(),
    finishedAt: model.finishedOn?.toISOString() ?? null,
    open: model.isOpen,
  }
}
