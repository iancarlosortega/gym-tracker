import { callerId } from '@api/modules/auth/presentation/caller.js'
import type { RequestWithCaller } from '@api/modules/auth/presentation/session.guard.js'
import { CreateExerciseUseCase } from '@api/modules/catalog/application/use-cases/create-exercise.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Body, Controller, Post, Req } from '@nestjs/common'
import { CreateExerciseDto } from './create-exercise.dto.js'

@Controller('exercises')
export class CreateExerciseController {
  constructor(private readonly createExercise: CreateExerciseUseCase) {}

  @Post()
  async handle(
    @Req() request: RequestWithCaller,
    @Body() body: CreateExerciseDto,
  ): Promise<ExerciseView> {
    const created = await this.createExercise.execute({
      userId: callerId(request),
      name: body.name,
      defaultMode: body.defaultMode,
    })

    return toExerciseView(created)
  }
}
