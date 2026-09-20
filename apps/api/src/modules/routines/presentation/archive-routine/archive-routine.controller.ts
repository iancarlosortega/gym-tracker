import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ArchiveRoutineUseCase } from '@api/modules/routines/application/use-cases/archive-routine.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('routines')
export class ArchiveRoutineController {
  constructor(private readonly archiveRoutine: ArchiveRoutineUseCase) {}

  @Post(':id/archive')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoutineView> {
    return toRoutineView(await this.archiveRoutine.execute({ userId, routineId: id }))
  }
}
