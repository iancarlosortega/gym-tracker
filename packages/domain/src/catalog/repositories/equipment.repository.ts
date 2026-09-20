import type { Equipment, EquipmentKind } from '@domain/catalog/entities/equipment.entity.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import type { Page } from '@domain/shared/value-objects/page.vo.js'
import type { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import type { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'

export interface EquipmentCriteriaFields {
  readonly id?: string
  readonly userId?: string
  readonly name?: string
  readonly kind?: EquipmentKind
  readonly archived?: boolean
}

export type EquipmentCriteria = Criteria<EquipmentCriteriaFields>

export type EquipmentSortField = 'name' | 'createdAt'

export type EquipmentQueryOptions = QueryOptions<EquipmentSortField>

export interface EquipmentRepository {
  save(equipment: Equipment): Promise<void>
  findOne(criteria: EquipmentCriteria): Promise<Equipment | null>
  /** Pagination is required, so an unbounded read cannot be expressed here. */
  findMany(
    criteria: EquipmentCriteria,
    pagination: Pagination,
    options?: EquipmentQueryOptions,
  ): Promise<Page<Equipment>>
  count(criteria: EquipmentCriteria): Promise<number>
}
