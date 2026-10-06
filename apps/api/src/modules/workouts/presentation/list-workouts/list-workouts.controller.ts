import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ListWorkoutsUseCase } from '@api/modules/workouts/application/use-cases/list-workouts.use-case.js'
import type { WorkoutHistoryEntry } from '@gym/domain/workouts/repositories/workout-history.repository'
import { Controller, Get, Query } from '@nestjs/common'
import { ListWorkoutsDto } from './list-workouts.dto.js'

export interface WorkoutHistoryEntryView {
  readonly id: string
  readonly routineId: string | null
  readonly routineName: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly setCount: number
}

export interface WorkoutHistoryPageView {
  readonly items: readonly WorkoutHistoryEntryView[]
  readonly nextOffset: number | null
}

const toView = (entry: WorkoutHistoryEntry): WorkoutHistoryEntryView => ({
  ...entry,
  startedAt: entry.startedAt.toISOString(),
  finishedAt: entry.finishedAt?.toISOString() ?? null,
})

/** The day each workout falls on is the phone's to work out, in its own zone. */
@Controller('workouts')
export class ListWorkoutsController {
  constructor(private readonly listWorkouts: ListWorkoutsUseCase) {}

  @Get()
  async handle(
    @GetUserId() userId: string,
    @Query() query: ListWorkoutsDto,
  ): Promise<WorkoutHistoryPageView> {
    const page = await this.listWorkouts.execute({ userId, ...query })

    return { items: page.items.map(toView), nextOffset: page.nextOffset }
  }
}
