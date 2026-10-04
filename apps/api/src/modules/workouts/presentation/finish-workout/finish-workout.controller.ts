import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { FinishWorkoutUseCase } from '@api/modules/workouts/application/use-cases/finish-workout.use-case.js'
import {
  toWorkoutSessionView,
  type WorkoutSessionView,
} from '@api/modules/workouts/presentation/workout-session.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { FinishWorkoutDto } from './finish-workout.dto.js'

@Controller('workouts')
export class FinishWorkoutController {
  constructor(private readonly finishWorkout: FinishWorkoutUseCase) {}

  @Post(':id/finish')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: FinishWorkoutDto,
  ): Promise<WorkoutSessionView> {
    return toWorkoutSessionView(
      await this.finishWorkout.execute({
        userId,
        sessionId: id,
        // The body is absent entirely when the client asks for "now".
        finishedAt: body?.finishedAt === undefined ? undefined : new Date(body.finishedAt),
      }),
    )
  }
}
