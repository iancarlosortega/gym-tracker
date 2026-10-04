import {
  EQUIPMENT_REPOSITORY,
  EQUIPMENT_USAGE_REPOSITORY,
} from '@api/modules/catalog/catalog.tokens.js'
import type { EquipmentRepository } from '@gym/domain/catalog/repositories/equipment.repository'
import type {
  EquipmentUsage,
  EquipmentUsageRepository,
} from '@gym/domain/catalog/repositories/equipment-usage.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedEquipment } from './find-equipment.js'

export interface GetEquipmentUsageInput {
  readonly userId: string
  readonly equipmentId: string
}

/** Ownership first, so someone else's equipment is refused before anything is counted. */
@Injectable()
export class GetEquipmentUsageUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository,
    @Inject(EQUIPMENT_USAGE_REPOSITORY) private readonly usage: EquipmentUsageRepository,
  ) {}

  async execute(input: GetEquipmentUsageInput): Promise<EquipmentUsage> {
    await findOwnedEquipment(this.equipment, input.userId, input.equipmentId)
    return await this.usage.usageOf(input.userId, input.equipmentId)
  }
}
