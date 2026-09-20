import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ScheduleRestPushUseCase } from '@api/modules/push/application/use-cases/schedule-rest-push.use-case.js'
import { Body, Controller, Post } from '@nestjs/common'
import { ScheduleRestPushDto } from './schedule-rest-push.dto.js'

export interface ScheduledPushView {
  readonly setId: string
  readonly fireAt: string
}

@Controller('rest-alerts')
export class ScheduleRestPushController {
  constructor(private readonly scheduleRestPush: ScheduleRestPushUseCase) {}

  @Post()
  async handle(
    @GetUserId() userId: string,
    @Body() body: ScheduleRestPushDto,
  ): Promise<ScheduledPushView> {
    const push = await this.scheduleRestPush.execute({
      userId,
      setId: body.setId,
      fireAt: body.fireAt,
    })

    return { setId: push.setId.value, fireAt: push.fireAt.toISOString() }
  }
}
