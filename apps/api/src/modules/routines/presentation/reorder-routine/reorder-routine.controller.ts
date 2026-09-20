import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ReorderRoutineUseCase } from '@api/modules/routines/application/use-cases/reorder-routine.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common'
import { ReorderRoutineDto } from './reorder-routine.dto.js'

@Controller('routines')
export class ReorderRoutineController {
  constructor(private readonly reorderRoutine: ReorderRoutineUseCase) {}

  @Put(':id/order')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReorderRoutineDto,
  ): Promise<RoutineView> {
    return toRoutineView(
      await this.reorderRoutine.execute({ userId, routineId: id, entryIds: body.entryIds }),
    )
  }
}
