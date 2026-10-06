import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type {
  WorkoutHistoryEntry,
  WorkoutHistoryRepository,
} from '@gym/domain/workouts/repositories/workout-history.repository'

/** Entries are given whole; the double only owns ordering, scoping and paging. */
export class InMemoryWorkoutHistoryRepository implements WorkoutHistoryRepository {
  readonly entries: Array<WorkoutHistoryEntry & { readonly userId: string }> = []

  async page(userId: string, pagination: Pagination): Promise<Page<WorkoutHistoryEntry>> {
    const owned = this.entries
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
      .map(({ userId: _owner, ...entry }) => entry)

    return Page.create(
      owned.slice(pagination.offset, pagination.offset + pagination.limit),
      owned.length,
      pagination,
    )
  }
}
