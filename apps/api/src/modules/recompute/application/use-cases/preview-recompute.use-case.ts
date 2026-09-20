import { EQUIPMENT_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import { tokenFor } from '@api/modules/recompute/application/recompute-token.js'
import { STATISTICS_REPOSITORY } from '@api/modules/statistics/statistics.tokens.js'
import { EquipmentNotFoundError } from '@gym/domain/catalog/errors'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { recomputeFor } from '@gym/domain/recompute/services/recompute.service'
import type { RecomputeDiff } from '@gym/domain/recompute/value-objects/recompute-diff.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { Inject, Injectable } from '@nestjs/common'

export interface PreviewRecomputeInput {
  readonly userId: string
  readonly equipmentId: string
}

/** Every set ever logged; a correction reaches as far back as the equipment does. */
const ALL_OF_HISTORY = DateRange.between(new Date(0), new Date('2999-12-31T23:59:59.999Z'))

/**
 * Show what correcting this equipment would do. Writes nothing.
 *
 * The whole flow exists so the user sees the damage before agreeing to it.
 * A bar recorded as twenty when it was fifteen has been inflating every
 * per-side set for months, and fixing that silently would replace one wrong
 * history with another they never chose.
 */
@Injectable()
export class PreviewRecomputeUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository,
    @Inject(STATISTICS_REPOSITORY) private readonly statistics: StatisticsRepository,
  ) {}

  async execute(input: PreviewRecomputeInput): Promise<RecomputeDiff> {
    const equipment = await this.equipment.findOne(
      Criteria.create<EquipmentCriteriaFields>({ id: input.equipmentId, userId: input.userId }),
    )

    if (equipment === null) {
      throw new EquipmentNotFoundError('That equipment does not exist.')
    }

    const sets = await this.statistics.setsInPeriod(input.userId, ALL_OF_HISTORY)

    return recomputeFor(equipment, sets, (changes) => tokenFor(equipment.id.value, changes))
  }
}
