import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ChangeRoutineEntryUseCase } from '@api/modules/routines/application/use-cases/change-routine-entry.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ChangeRoutineEntryDto } from './change-routine-entry.dto.js'

@Controller('routines')
export class ChangeRoutineEntryController {
  constructor(private readonly changeRoutineEntry: ChangeRoutineEntryUseCase) {}

  @Patch(':id/exercises/:entryId')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() body: ChangeRoutineEntryDto,
  ): Promise<RoutineView> {
    return toRoutineView(
      await this.changeRoutineEntry.execute({
        userId,
        routineId: id,
        entryId,
        targetSets: body.targetSets,
        targetRepsMin: body.targetRepsMin,
        targetRepsMax: body.targetRepsMax,
        restSeconds: body.restSeconds,
      }),
    )
  }
}
