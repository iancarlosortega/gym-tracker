import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { GetLastSetsUseCase } from '@api/modules/measurement/application/use-cases/get-last-sets.use-case.js'
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { GetLastSetsDto } from './get-last-sets.dto.js'

export interface LastSetsView {
  readonly sessionStartedAt: string
  readonly sets: readonly {
    readonly setNumber: number
    readonly mode: string
    readonly value: number
    readonly reps: number
  }[]
}

@Controller('exercises')
export class GetLastSetsController {
  constructor(private readonly getLastSets: GetLastSetsUseCase) {}

  /** Null, not 404, when the exercise was never done: that is an answer, not a missing resource. */
  @Get(':id/last-sets')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetLastSetsDto,
  ): Promise<LastSetsView | null> {
    const last = await this.getLastSets.execute({
      userId,
      exerciseId: id,
      excludingSessionId: query.excludingSession ?? null,
    })

    return last === null
      ? null
      : { sessionStartedAt: last.sessionStartedAt.toISOString(), sets: last.sets }
  }
}
