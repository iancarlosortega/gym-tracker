import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { FinishWorkoutUseCase } from '@api/modules/workouts/application/use-cases/finish-workout.use-case.js'
import {
  toWorkoutSessionView,
  type WorkoutSessionView,
} from '@api/modules/workouts/presentation/workout-session.view.js'
import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('workouts')
export class FinishWorkoutController {
  constructor(private readonly finishWorkout: FinishWorkoutUseCase) {}

  @Post(':id/finish')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkoutSessionView> {
    return toWorkoutSessionView(await this.finishWorkout.execute({ userId, sessionId: id }))
  }
}
