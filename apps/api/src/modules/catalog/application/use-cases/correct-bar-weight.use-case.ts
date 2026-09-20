import { EQUIPMENT_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import type { EquipmentRepository } from '@gym/domain/catalog/repositories/equipment.repository'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedEquipment } from './find-equipment.js'

export interface CorrectBarWeightInput {
  readonly userId: string
  readonly equipmentId: string
  readonly barKilograms: number
}

@Injectable()
export class CorrectBarWeightUseCase {
  constructor(@Inject(EQUIPMENT_REPOSITORY) private readonly equipment: EquipmentRepository) {}

  /**
   * Correcting the bar weight applies to sets logged from now on.
   *
   * Sets already logged keep the bar weight snapshotted on them, so a
   * correction never silently rewrites history. Bringing past sets in line is
   * the separate, previewed recompute.
   */
  async execute(input: CorrectBarWeightInput): Promise<Equipment> {
    const found = await findOwnedEquipment(this.equipment, input.userId, input.equipmentId)
    const corrected = found.withBarWeight(fromKilograms(input.barKilograms))

    await this.equipment.save(corrected)
    return corrected
  }
}
