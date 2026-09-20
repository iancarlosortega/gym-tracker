import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import type {
  EquipmentCriteria,
  EquipmentQueryOptions,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

export class InMemoryEquipmentRepository implements EquipmentRepository {
  readonly equipment = new Map<string, Equipment>()

  async save(model: Equipment): Promise<void> {
    this.equipment.set(model.id.value, model)
  }

  async findOne(criteria: EquipmentCriteria): Promise<Equipment | null> {
    return this.matching(criteria)[0] ?? null
  }

  async findMany(
    criteria: EquipmentCriteria,
    pagination: Pagination,
    options?: EquipmentQueryOptions,
  ): Promise<Page<Equipment>> {
    const found = this.matching(criteria)

    if (options?.orderBy === 'name') {
      found.sort((left, right) => left.name.value.localeCompare(right.name.value))
    }

    return Page.create(
      found.slice(pagination.offset, pagination.offset + pagination.limit),
      found.length,
      pagination,
    )
  }

  async count(criteria: EquipmentCriteria): Promise<number> {
    return this.matching(criteria).length
  }

  private matching(criteria: EquipmentCriteria): Equipment[] {
    return [...this.equipment.values()].filter((model) => {
      const id = criteria.get('id')
      const userId = criteria.get('userId')
      const name = criteria.get('name')
      const kind = criteria.get('kind')
      const archived = criteria.get('archived')

      if (id !== undefined && model.id.value !== id) return false
      if (userId !== undefined && model.userId.value !== userId) return false
      if (name !== undefined && model.name.value.toLowerCase() !== name.toLowerCase()) return false
      if (kind !== undefined && model.kind !== kind) return false
      if (archived !== undefined && model.isArchived !== archived) return false
      return true
    })
  }
}
