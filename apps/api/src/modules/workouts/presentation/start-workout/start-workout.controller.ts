import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { StartWorkoutUseCase } from '@api/modules/workouts/application/use-cases/start-workout.use-case.js'
import {
  toWorkoutSessionView,
  type WorkoutSessionView,
} from '@api/modules/workouts/presentation/workout-session.view.js'
import { Body, Controller, Post } from '@nestjs/common'
import { StartWorkoutDto } from './start-workout.dto.js'

@Controller('workouts')
export class StartWorkoutController {
  constructor(private readonly startWorkout: StartWorkoutUseCase) {}

  @Post()
  async handle(
    @GetUserId() userId: string,
    @Body() body: StartWorkoutDto,
  ): Promise<WorkoutSessionView> {
    return toWorkoutSessionView(
      await this.startWorkout.execute({ userId, routineId: body.routineId }),
    )
  }
}
