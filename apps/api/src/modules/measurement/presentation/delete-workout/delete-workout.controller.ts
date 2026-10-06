import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { DeleteWorkoutUseCase } from '@api/modules/measurement/application/use-cases/delete-workout.use-case.js'
import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common'

@Controller('workouts')
export class DeleteWorkoutController {
  constructor(private readonly deleteWorkout: DeleteWorkoutUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@GetUserId() userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteWorkout.execute({ userId, sessionId: id })
  }
}
