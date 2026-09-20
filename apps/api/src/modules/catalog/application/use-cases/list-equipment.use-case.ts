import { EQUIPMENT_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import type { Equipment, EquipmentKind } from '@gym/domain/catalog/entities/equipment.entity'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
  EquipmentSortField,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { Page } from '@gym/domain/shared/value-objects/page.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ListEquipmentInput {
  readonly userId: string
  readonly kind?: EquipmentKind | undefined
  readonly includeArchived?: boolean | undefined
  readonly limit?: number | undefined
  readonly offset?: number | undefined
}

@Injectable()
export class ListEquipmentUseCase {
  constructor(@Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository) {}

  async execute(input: ListEquipmentInput): Promise<Page<Equipment>> {
    const criteria = Criteria.create<EquipmentCriteriaFields>({
      userId: input.userId,
      kind: input.kind,
      archived: input.includeArchived === true ? undefined : false,
    })

    return await this.equipment.findMany(
      criteria,
      Pagination.create({ limit: input.limit, offset: input.offset }),
      QueryOptions.none<EquipmentSortField>().orderedBy('name'),
    )
  }
}
