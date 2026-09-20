import { CancelRestPushUseCase } from '@api/modules/push/application/use-cases/cancel-rest-push.use-case.js'
import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common'

/** No DTO: the only input is the set whose rest was dismissed. */
@Controller('rest-alerts')
export class CancelRestPushController {
  constructor(private readonly cancelRestPush: CancelRestPushUseCase) {}

  @Delete(':setId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@Param('setId', ParseUUIDPipe) setId: string): Promise<void> {
    await this.cancelRestPush.execute({ setId })
  }
}
