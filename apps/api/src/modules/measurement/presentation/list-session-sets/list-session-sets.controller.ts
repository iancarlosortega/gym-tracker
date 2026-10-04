import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ListSessionSetsUseCase } from '@api/modules/measurement/application/use-cases/list-session-sets.use-case.js'
import {
  type LoggedSetView,
  toLoggedSetView,
} from '@api/modules/measurement/presentation/logged-set.view.js'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'

@Controller('workouts')
export class ListSessionSetsController {
  constructor(private readonly listSessionSets: ListSessionSetsUseCase) {}

  @Get(':id/sets')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<readonly LoggedSetView[]> {
    const sets = await this.listSessionSets.execute({ userId, sessionId: id })
    return sets.map(toLoggedSetView)
  }
}
