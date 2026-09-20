import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { RenameRoutineUseCase } from '@api/modules/routines/application/use-cases/rename-routine.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { RenameRoutineDto } from './rename-routine.dto.js'

@Controller('routines')
export class RenameRoutineController {
  constructor(private readonly renameRoutine: RenameRoutineUseCase) {}

  @Patch(':id')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameRoutineDto,
  ): Promise<RoutineView> {
    return toRoutineView(
      await this.renameRoutine.execute({ userId, routineId: id, name: body.name }),
    )
  }
}
