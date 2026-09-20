import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { averageLoad, totalVolume } from '@gym/domain/statistics/services/volume.service'
import type { MassAggregate } from '@gym/domain/statistics/value-objects/mass-aggregate.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ReadVolumeInput {
  readonly userId: string
  readonly from: Date
  readonly to: Date
}

export interface VolumeSummary {
  readonly volume: MassAggregate
  readonly averageLoad: MassAggregate
}

/**
 * What a period weighed, and what it could not weigh.
 *
 * Both figures are computed from the same set of sets, so their exclusion
 * counts always agree — two reads could disagree if a set were logged
 * between them, and a summary that contradicts itself is worse than a stale
 * one.
 */
@Injectable()
export class ReadVolumeUseCase {
  constructor(@Inject(STATISTICS_REPOSITORY) private readonly statistics: StatisticsRepository) {}

  async execute(input: ReadVolumeInput): Promise<VolumeSummary> {
    const sets = await this.statistics.setsInPeriod(
      input.userId,
      DateRange.between(input.from, input.to),
    )

    return { volume: totalVolume(sets), averageLoad: averageLoad(sets) }
  }
}
