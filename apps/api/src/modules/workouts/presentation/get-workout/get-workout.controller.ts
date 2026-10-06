import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { GetWorkoutUseCase } from '@api/modules/workouts/application/use-cases/get-workout.use-case.js'
import {
  toWorkoutHistoryEntryView,
  type WorkoutHistoryEntryView,
} from '@api/modules/workouts/presentation/workout-history.view.js'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'

/**
 * Registered after ResumeWorkoutController in WorkoutsModule, so
 * "/workouts/current" is matched there before it can reach ":id".
 */
@Controller('workouts')
export class GetWorkoutController {
  constructor(private readonly getWorkout: GetWorkoutUseCase) {}

  @Get(':id')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkoutHistoryEntryView> {
    return toWorkoutHistoryEntryView(await this.getWorkout.execute({ userId, workoutId: id }))
  }
}
