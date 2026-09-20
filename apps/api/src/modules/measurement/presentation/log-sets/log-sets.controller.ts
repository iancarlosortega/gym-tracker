import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { LogSetsUseCase } from '@api/modules/measurement/application/use-cases/log-sets.use-case.js'
import {
  type LoggedSetView,
  toLoggedSetView,
} from '@api/modules/measurement/presentation/logged-set.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { LogSetsDto } from './log-sets.dto.js'

/**
 * Sets are posted to the workout they belong to.
 *
 * The same endpoint serves the online path and the queue drain: one set or a
 * hundred, the delivery is idempotent on each set's client-generated id, so a
 * lost acknowledgement costs a retry and never a duplicate.
 */
@Controller('workouts')
export class LogSetsController {
  constructor(private readonly logSets: LogSetsUseCase) {}

  @Post(':id/sets')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: LogSetsDto,
  ): Promise<readonly LoggedSetView[]> {
    const logged = await this.logSets.execute({ userId, sessionId: id, sets: body.sets })

    return logged.map(toLoggedSetView)
  }
}
