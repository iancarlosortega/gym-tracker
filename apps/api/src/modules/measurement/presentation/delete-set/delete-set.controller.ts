import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { DeleteSetUseCase } from '@api/modules/measurement/application/use-cases/delete-set.use-case.js'
import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common'

@Controller('sets')
export class DeleteSetController {
  constructor(private readonly deleteSet: DeleteSetUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@GetUserId() userId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteSet.execute({ userId, setId: id })
  }
}
