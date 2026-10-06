import { WORKOUT_HISTORY_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type {
  WorkoutHistoryEntry,
  WorkoutHistoryRepository,
} from '@gym/domain/workouts/repositories/workout-history.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface ListWorkoutsInput {
  readonly userId: string
  readonly limit?: number | undefined
  readonly offset?: number | undefined
  /** Started at or after; a calendar month's first local instant. */
  readonly from?: Date | undefined
  /** Started before; the next month's first local instant. */
  readonly to?: Date | undefined
}

export interface WorkoutHistoryPage {
  readonly items: readonly WorkoutHistoryEntry[]
  /** Where the next page starts, or null after the last one. */
  readonly nextOffset: number | null
}

/** The user's workouts, newest first, a page at a time. */
@Injectable()
export class ListWorkoutsUseCase {
  constructor(
    @Inject(WORKOUT_HISTORY_REPOSITORY) private readonly history: WorkoutHistoryRepository,
  ) {}

  async execute(input: ListWorkoutsInput): Promise<WorkoutHistoryPage> {
    const page = await this.history.page(
      input.userId,
      Pagination.create({ limit: input.limit, offset: input.offset }),
      { from: input.from, to: input.to },
    )

    return {
      items: page.items,
      nextOffset: page.hasMore ? page.offset + page.items.length : null,
    }
  }
}
