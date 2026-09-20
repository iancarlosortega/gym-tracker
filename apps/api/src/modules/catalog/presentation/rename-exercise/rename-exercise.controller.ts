import { callerId } from '@api/modules/auth/presentation/caller.js'
import type { RequestWithCaller } from '@api/modules/auth/presentation/session.guard.js'
import { RenameExerciseUseCase } from '@api/modules/catalog/application/use-cases/rename-exercise.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Patch, Req } from '@nestjs/common'
import { RenameExerciseDto } from './rename-exercise.dto.js'

@Controller('exercises')
export class RenameExerciseController {
  constructor(private readonly renameExercise: RenameExerciseUseCase) {}

  @Patch(':id')
  async handle(
    @Req() request: RequestWithCaller,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameExerciseDto,
  ): Promise<ExerciseView> {
    const renamed = await this.renameExercise.execute({
      userId: callerId(request),
      exerciseId: id,
      name: body.name,
    })

    return toExerciseView(renamed)
  }
}
