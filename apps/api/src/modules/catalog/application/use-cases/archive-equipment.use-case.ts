import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import type { EquipmentRepository } from '@gym/domain/catalog/repositories/equipment.repository'
import { findOwnedEquipment } from './find-equipment.js'

export interface ArchiveEquipmentInput {
  readonly userId: string
  readonly equipmentId: string
}

export class ArchiveEquipmentUseCase {
  constructor(
    private readonly equipment: EquipmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ArchiveEquipmentInput): Promise<Equipment> {
    const found = await findOwnedEquipment(this.equipment, input.userId, input.equipmentId)
    const archived = found.archivedAt(this.clock.now())

    await this.equipment.save(archived)
    return archived
  }
}
