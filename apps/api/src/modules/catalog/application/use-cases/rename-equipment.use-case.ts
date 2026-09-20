import { EQUIPMENT_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import type { EquipmentRepository } from '@gym/domain/catalog/repositories/equipment.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedEquipment } from './find-equipment.js'

export interface RenameEquipmentInput {
  readonly userId: string
  readonly equipmentId: string
  readonly name: string
}

@Injectable()
export class RenameEquipmentUseCase {
  constructor(@Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository) {}

  async execute(input: RenameEquipmentInput): Promise<Equipment> {
    const found = await findOwnedEquipment(this.equipment, input.userId, input.equipmentId)
    const renamed = found.renamedTo(input.name)

    await this.equipment.save(renamed)
    return renamed
  }
}
