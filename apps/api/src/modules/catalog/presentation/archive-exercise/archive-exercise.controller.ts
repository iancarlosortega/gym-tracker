import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ArchiveExerciseUseCase } from '@api/modules/catalog/application/use-cases/archive-exercise.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('exercises')
export class ArchiveExerciseController {
  constructor(private readonly archiveExercise: ArchiveExerciseUseCase) {}

  @Post(':id/archive')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExerciseView> {
    const archived = await this.archiveExercise.execute({
      userId,
      exerciseId: id,
    })

    return toExerciseView(archived)
  }
}
