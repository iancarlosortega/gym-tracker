import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { GetRoutineUseCase } from '@api/modules/routines/application/use-cases/get-routine.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'

@Controller('routines')
export class GetRoutineController {
  constructor(private readonly getRoutine: GetRoutineUseCase) {}

  @Get(':id')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoutineView> {
    return toRoutineView(await this.getRoutine.execute({ userId, routineId: id }))
  }
}
