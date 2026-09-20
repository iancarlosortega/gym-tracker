import { callerId } from '@api/modules/auth/presentation/caller.js'
import type { RequestWithCaller } from '@api/modules/auth/presentation/session.guard.js'
import { ArchiveExerciseUseCase } from '@api/modules/catalog/application/use-cases/archive-exercise.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Controller, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('exercises')
export class ArchiveExerciseController {
  constructor(private readonly archiveExercise: ArchiveExerciseUseCase) {}

  @Post(':id/archive')
  async handle(
    @Req() request: RequestWithCaller,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExerciseView> {
    const archived = await this.archiveExercise.execute({
      userId: callerId(request),
      exerciseId: id,
    })

    return toExerciseView(archived)
  }
}
