import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ListWorkoutsUseCase } from '@api/modules/workouts/application/use-cases/list-workouts.use-case.js'
import {
  toWorkoutHistoryEntryView,
  type WorkoutHistoryEntryView,
} from '@api/modules/workouts/presentation/workout-history.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ListWorkoutsDto } from './list-workouts.dto.js'

export interface WorkoutHistoryPageView {
  readonly items: readonly WorkoutHistoryEntryView[]
  readonly nextOffset: number | null
}

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

    return { items: page.items.map(toWorkoutHistoryEntryView), nextOffset: page.nextOffset }
  }
}
