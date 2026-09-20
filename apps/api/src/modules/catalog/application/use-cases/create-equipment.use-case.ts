import { Equipment, type EquipmentKind } from '@gym/domain/catalog/entities/equipment.entity'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

export interface CreateEquipmentInput {
  readonly userId: string
  readonly name: string
  readonly kind: EquipmentKind
  /** Kilograms at the edge; the domain stores grams. */
  readonly barKilograms?: number | undefined
  readonly stackPositions?: number | undefined
}

export class CreateEquipmentUseCase {
  constructor(private readonly equipment: EquipmentRepository) {}

  async execute(input: CreateEquipmentInput): Promise<Equipment> {
    const created = Equipment.create({
      userId: Id.restore(input.userId),
      name: input.name,
      kind: input.kind,
      barGrams: input.barKilograms === undefined ? undefined : fromKilograms(input.barKilograms),
      stackPositions: input.stackPositions,
    })

    // The same name is the same machine: a second row would split the history
    // of every set logged against it.
    const existing = await this.equipment.findOne(
      Criteria.create<EquipmentCriteriaFields>({ userId: input.userId, name: created.name.value }),
    )
    if (existing !== null) {
      return existing.isArchived ? await this.reactivate(existing) : existing
    }

    await this.equipment.save(created)
    return created
  }

  private async reactivate(equipment: Equipment): Promise<Equipment> {
    const active = equipment.unarchived()
    await this.equipment.save(active)
    return active
  }
}
