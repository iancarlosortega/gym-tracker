import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import type { ExerciseProgression } from '@gym/domain/statistics/services/progression.service'
import { progression } from '@gym/domain/statistics/services/progression.service'
import { Inject, Injectable } from '@nestjs/common'

export interface ReadProgressionInput {
  readonly userId: string
  readonly exerciseId: string
  readonly from: Date
  readonly to: Date
}

@Injectable()
export class ReadProgressionUseCase {
  constructor(@Inject(STATISTICS_REPOSITORY) private readonly statistics: StatisticsRepository) {}

  async execute(input: ReadProgressionInput): Promise<ExerciseProgression> {
    const sets = await this.statistics.setsForExercise(
      input.userId,
      input.exerciseId,
      DateRange.between(input.from, input.to),
    )

    return progression(input.exerciseId, sets)
  }
}
