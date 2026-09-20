import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ReadWeekUseCase } from '@api/modules/statistics/application/use-cases/read-week.use-case.js'
import {
  toWeekComparisonView,
  type WeekComparisonView,
} from '@api/modules/statistics/presentation/statistics.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ReadWeekDto } from './read-week.dto.js'

@Controller('statistics')
export class ReadWeekController {
  constructor(private readonly readWeek: ReadWeekUseCase) {}

  @Get('week')
  async handle(
    @GetUserId() userId: string,
    @Query() query: ReadWeekDto,
  ): Promise<WeekComparisonView> {
    return toWeekComparisonView(await this.readWeek.execute({ userId, weekStart: query.weekStart }))
  }
}
