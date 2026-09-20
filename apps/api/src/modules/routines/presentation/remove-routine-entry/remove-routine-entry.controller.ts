import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { RemoveRoutineEntryUseCase } from '@api/modules/routines/application/use-cases/remove-routine-entry.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Controller, Delete, Param, ParseUUIDPipe } from '@nestjs/common'

/** No DTO: both identifiers come from the path. */
@Controller('routines')
export class RemoveRoutineEntryController {
  constructor(private readonly removeRoutineEntry: RemoveRoutineEntryUseCase) {}

  @Delete(':id/exercises/:entryId')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<RoutineView> {
    return toRoutineView(await this.removeRoutineEntry.execute({ userId, routineId: id, entryId }))
  }
}
