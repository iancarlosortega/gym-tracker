import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ReadProgressionUseCase } from '@api/modules/statistics/application/use-cases/read-progression.use-case.js'
import {
  type ExerciseProgressionView,
  toExerciseProgressionView,
} from '@api/modules/statistics/presentation/statistics.view.js'
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ReadVolumeDto } from '../read-volume/read-volume.dto.js'

@Controller('statistics')
export class ReadProgressionController {
  constructor(private readonly readProgression: ReadProgressionUseCase) {}

  @Get('exercises/:id/progression')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) exerciseId: string,
    @Query() query: ReadVolumeDto,
  ): Promise<ExerciseProgressionView> {
    return toExerciseProgressionView(
      await this.readProgression.execute({
        userId,
        exerciseId,
        from: query.from,
        to: query.to,
        timeZone: query.timeZone,
      }),
    )
  }
}
