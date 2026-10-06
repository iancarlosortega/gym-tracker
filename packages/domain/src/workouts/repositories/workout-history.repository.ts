import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'

/** One past (or still open) workout, as the history list shows it. */
export interface WorkoutHistoryEntry {
  readonly id: string
  readonly routineId: string | null
  /** Null for a workout started without a routine. */
  readonly routineName: string | null
  readonly startedAt: Date
  /** Null while the workout is still open. */
  readonly finishedAt: Date | null
  /** Live sets only: a deleted set is not counted. */
  readonly setCount: number
}

/**
 * The user's workouts, newest first, a page at a time.
 *
 * A read model rather than a method on `WorkoutSessionRepository`: the list
 * joins the routine's name and counts sets, which a session does not hold.
 */
export interface WorkoutHistoryRepository {
  page(userId: string, pagination: Pagination): Promise<Page<WorkoutHistoryEntry>>
}
