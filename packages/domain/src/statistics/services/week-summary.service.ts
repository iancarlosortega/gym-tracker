import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import {
  type ProgressionPoint,
  progression,
  weekOverWeek,
} from '@domain/statistics/services/progression.service.js'
import type { WorkoutSession } from '@domain/workouts/entities/workout-session.entity.js'

/**
 * How much of the plan was actually done.
 *
 * Null rather than zero when no session that week followed a routine. An ad
 * hoc week has no plan to fall short of, and a nought out of nought would
 * read as a failure to do something nobody had asked for.
 */
export interface PlanCompletion {
  readonly plannedSets: number
  readonly completedSets: number
}

export interface ExerciseMovement {
  readonly exerciseId: string
  readonly direction: 'up' | 'held' | 'down'
}

export interface WeekSummary {
  /** Mode-agnostic on purpose: a set counts whatever scale measured it. */
  readonly sets: number
  readonly workouts: number
  readonly plan: PlanCompletion | null
  readonly movements: readonly ExerciseMovement[]
}

export interface WeekInput {
  readonly sets: readonly LoggedSet[]
  readonly sessions: readonly WorkoutSession[]
  /** Planned sets for each routine followed this week, by routine id. */
  readonly plannedSetsByRoutine: ReadonlyMap<string, number>
  /** The week before, so every figure can be stated against it. */
  readonly previousSets: readonly LoggedSet[]
}

/**
 * The week, in the terms the user asked for.
 *
 * Sets rather than tonnage leads, because a set counts the same whether it
 * was a barbell or a pin position — it is the one headline figure that needs
 * no exclusion notice attached to it.
 */
export const weekSummary = (input: WeekInput): WeekSummary => ({
  sets: input.sets.length,
  workouts: input.sessions.length,
  plan: planCompletion(input),
  movements: movements(input.sets, input.previousSets),
})

const planCompletion = (input: WeekInput): PlanCompletion | null => {
  const followed = input.sessions
    .map((session) => session.routineId?.value)
    .filter((routineId): routineId is string => routineId !== undefined)

  if (followed.length === 0) {
    return null
  }

  const plannedSets = followed.reduce(
    (total, routineId) => total + (input.plannedSetsByRoutine.get(routineId) ?? 0),
    0,
  )

  const routineSessions = new Set(
    input.sessions
      .filter((session) => session.routineId !== null)
      .map((session) => session.id.value),
  )

  return {
    plannedSets,
    completedSets: input.sets.filter((set) => routineSessions.has(set.sessionId)).length,
  }
}

/**
 * Which exercises moved, comparing like with like.
 *
 * An exercise whose measurement changed between the two weeks is left out
 * rather than guessed at: the numbers are on different scales and no
 * direction between them would mean anything.
 */
const movements = (
  sets: readonly LoggedSet[],
  previousSets: readonly LoggedSet[],
): ExerciseMovement[] => {
  const exerciseIds = [...new Set(sets.map((set) => set.exerciseId))]

  return exerciseIds.flatMap((exerciseId) => {
    const current = lastPointOf(exerciseId, sets)
    const previous = lastPointOf(exerciseId, previousSets)

    if (current === undefined || previous === undefined) {
      return []
    }
    if (current.mode !== previous.mode) {
      return []
    }

    const comparison = weekOverWeek(previous.point, current.point)

    if (comparison.kind === 'incomparable') {
      return []
    }

    return [
      {
        exerciseId,
        direction:
          comparison.kind === 'improved' ? 'up' : comparison.kind === 'declined' ? 'down' : 'held',
      } as const,
    ]
  })
}

const lastPointOf = (
  exerciseId: string,
  sets: readonly LoggedSet[],
): { readonly point: ProgressionPoint; readonly mode: string } | undefined => {
  const series = progression(exerciseId, sets).series.at(-1)
  const point = series?.points.at(-1)

  return series === undefined || point === undefined ? undefined : { point, mode: series.mode }
}
