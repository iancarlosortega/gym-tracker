import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { EquipmentNotFoundError } from '@gym/domain/catalog/errors'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

/**
 * Load a user's equipment or refuse.
 *
 * Scoped by user as well as id, and the same error whether the row is missing
 * or belongs to someone else: an identifier must not reveal that a record
 * exists elsewhere.
 */
export async function findOwnedEquipment(
  repository: EquipmentRepository,
  userId: string,
  equipmentId: string,
): Promise<Equipment> {
  const equipment = await repository.findOne(
    Criteria.create<EquipmentCriteriaFields>({ id: equipmentId, userId }),
  )

  if (equipment === null) {
    throw new EquipmentNotFoundError('That equipment does not exist.')
  }
  return equipment
}
