import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { CreateRoutineUseCase } from '@api/modules/routines/application/use-cases/create-routine.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Body, Controller, Post } from '@nestjs/common'
import { CreateRoutineDto } from './create-routine.dto.js'

@Controller('routines')
export class CreateRoutineController {
  constructor(private readonly createRoutine: CreateRoutineUseCase) {}

  @Post()
  async handle(@GetUserId() userId: string, @Body() body: CreateRoutineDto): Promise<RoutineView> {
    return toRoutineView(await this.createRoutine.execute({ userId, name: body.name }))
  }
}
