import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { CreateExerciseUseCase } from '@api/modules/catalog/application/use-cases/create-exercise.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Body, Controller, Post } from '@nestjs/common'
import { CreateExerciseDto } from './create-exercise.dto.js'

@Controller('exercises')
export class CreateExerciseController {
  constructor(private readonly createExercise: CreateExerciseUseCase) {}

  @Post()
  async handle(
    @GetUserId() userId: string,
    @Body() body: CreateExerciseDto,
  ): Promise<ExerciseView> {
    const created = await this.createExercise.execute({
      userId,
      name: body.name,
      defaultMode: body.defaultMode,
    })

    return toExerciseView(created)
  }
}
