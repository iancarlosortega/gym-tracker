import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ResumeWorkoutUseCase } from '@api/modules/workouts/application/use-cases/resume-workout.use-case.js'
import {
  toWorkoutSessionView,
  type WorkoutSessionView,
} from '@api/modules/workouts/presentation/workout-session.view.js'
import { Controller, Get } from '@nestjs/common'

/**
 * No DTO: the caller is the whole input.
 *
 * Nothing in progress answers 404, so the phone can ask on every launch and
 * read the absence of a workout from the status rather than from a null body.
 */
@Controller('workouts')
export class ResumeWorkoutController {
  constructor(private readonly resumeWorkout: ResumeWorkoutUseCase) {}

  @Get('current')
  async handle(@GetUserId() userId: string): Promise<WorkoutSessionView> {
    return toWorkoutSessionView(await this.resumeWorkout.execute({ userId }))
  }
}
