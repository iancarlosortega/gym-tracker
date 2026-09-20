import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import {
  type PushState,
  ReadPushStateUseCase,
} from '@api/modules/push/application/use-cases/read-push-state.use-case.js'
import { Controller, Get } from '@nestjs/common'

/** No DTO: the caller is the whole input. */
@Controller('push-subscriptions')
export class ReadPushStateController {
  constructor(private readonly readState: ReadPushStateUseCase) {}

  @Get('state')
  async handle(@GetUserId() userId: string): Promise<PushState> {
    return await this.readState.execute(userId)
  }
}
