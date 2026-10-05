import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ReorderRoutinesUseCase } from '@api/modules/routines/application/use-cases/reorder-routines.use-case.js'
import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common'
import { ReorderRoutinesDto } from './reorder-routines.dto.js'

@Controller('routines')
export class ReorderRoutinesController {
  constructor(private readonly reorderRoutines: ReorderRoutinesUseCase) {}

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@GetUserId() userId: string, @Body() body: ReorderRoutinesDto): Promise<void> {
    await this.reorderRoutines.execute({ userId, routineIds: body.routineIds })
  }
}
