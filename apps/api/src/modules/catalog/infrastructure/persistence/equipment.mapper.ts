import type { equipment } from '@api/database/schema/equipment.table.js'
import { Equipment, type EquipmentKind } from '@gym/domain/catalog/entities/equipment.entity'
import { EquipmentName } from '@gym/domain/catalog/value-objects/equipment-name.vo'
import { grams } from '@gym/domain/measurement/value-objects/grams.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type EquipmentRow = typeof equipment.$inferSelect
type EquipmentInsert = typeof equipment.$inferInsert

export const equipmentMapper = {
  toDomain(row: EquipmentRow): Equipment {
    const kind = row.kind as EquipmentKind

    return Equipment.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      name: EquipmentName.create(row.name),
      spec: specFrom(kind, row),
      archivedOn: row.archivedAt,
      createdAt: row.createdAt,
    })
  },

  toRow(model: Equipment): EquipmentInsert {
    return {
      id: model.id.value,
      userId: model.userId.value,
      name: model.name.value,
      kind: model.kind,
      barGrams: model.barGrams,
      stackPositions: model.stackPositions,
      archivedAt: model.archivedOn,
      createdAt: model.createdAt,
    }
  },
}

/**
 * The row's two nullable columns become the entity's discriminated union.
 *
 * The database guarantees a stack has its positions; a plate-loaded bar may
 * leave its weight out.
 */
function specFrom(kind: EquipmentKind, row: EquipmentRow) {
  if (kind === 'BARBELL') {
    // Null is a bar that is not counted (a Smith, a sled), not a 0 kg bar.
    return { kind, barGrams: row.barGrams === null ? null : grams(row.barGrams) } as const
  }
  if (kind === 'STACK') {
    return { kind, positions: row.stackPositions ?? 1 } as const
  }
  return { kind: 'FREE_WEIGHT' } as const
}
