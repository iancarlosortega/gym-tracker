import { ReadProgressionUseCase } from '@api/modules/statistics/application/use-cases/read-progression.use-case.js'
import { ReadVolumeUseCase } from '@api/modules/statistics/application/use-cases/read-volume.use-case.js'
import { ReadWeekUseCase } from '@api/modules/statistics/application/use-cases/read-week.use-case.js'
import { DrizzleStatisticsRepository } from '@api/modules/statistics/infrastructure/persistence/drizzle-statistics.repository.js'
import { ReadProgressionController } from '@api/modules/statistics/presentation/read-progression/read-progression.controller.js'
import { ReadVolumeController } from '@api/modules/statistics/presentation/read-volume/read-volume.controller.js'
import { ReadWeekController } from '@api/modules/statistics/presentation/read-week/read-week.controller.js'
import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import { Module } from '@nestjs/common'

/**
 * Composition root for statistics.
 *
 * Read-only: nothing here writes. The figures are derived from logged sets
 * every time they are asked for, so a corrected set changes its history the
 * moment it is corrected rather than when something is recomputed.
 */
@Module({
  controllers: [ReadVolumeController, ReadProgressionController, ReadWeekController],
  providers: [
    { provide: STATISTICS_REPOSITORY, useClass: DrizzleStatisticsRepository },
    ReadVolumeUseCase,
    ReadProgressionUseCase,
    ReadWeekUseCase,
  ],
})
export class StatisticsModule {}
