import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ReadVolumeUseCase } from '@api/modules/statistics/application/use-cases/read-volume.use-case.js'
import {
  type MassAggregateView,
  toMassAggregateView,
} from '@api/modules/statistics/presentation/statistics.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ReadVolumeDto } from './read-volume.dto.js'

export interface VolumeSummaryView {
  readonly volume: MassAggregateView
  readonly averageLoad: MassAggregateView
}

@Controller('statistics')
export class ReadVolumeController {
  constructor(private readonly readVolume: ReadVolumeUseCase) {}

  @Get('volume')
  async handle(
    @GetUserId() userId: string,
    @Query() query: ReadVolumeDto,
  ): Promise<VolumeSummaryView> {
    const summary = await this.readVolume.execute({ userId, from: query.from, to: query.to })

    return {
      volume: toMassAggregateView(summary.volume),
      averageLoad: toMassAggregateView(summary.averageLoad),
    }
  }
}
