import {
  type Database,
  DrizzleRepository,
  type SortColumns,
} from '@api/common/persistence/drizzle.repository.js'
import { type CriteriaConditions, where } from '@api/common/persistence/drizzle-criteria.js'
import { DATABASE } from '@api/database/database.module.js'
import { equipment } from '@api/database/schema/equipment.table.js'
import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import type {
  EquipmentCriteriaFields,
  EquipmentRepository,
  EquipmentSortField,
} from '@gym/domain/catalog/repositories/equipment.repository'
import { Inject, Injectable } from '@nestjs/common'
import { equipmentMapper } from './equipment.mapper.js'

type EquipmentRow = typeof equipment.$inferSelect

@Injectable()
export class DrizzleEquipmentRepository
  extends DrizzleRepository<Equipment, EquipmentRow, EquipmentCriteriaFields, EquipmentSortField>
  implements EquipmentRepository
{
  constructor(@Inject(DATABASE) database: Database) {
    super(database)
  }

  protected readonly table = equipment

  protected readonly conditions: CriteriaConditions<EquipmentCriteriaFields> = {
    id: where.equals(equipment.id),
    userId: where.equals(equipment.userId),
    name: where.equalsIgnoringCase(equipment.name),
    kind: where.equals(equipment.kind),
    archived: where.markedBy(equipment.archivedAt),
  }

  protected readonly sortColumns: SortColumns<EquipmentSortField> = {
    name: equipment.name,
    createdAt: equipment.createdAt,
  }

  protected toDomain(row: EquipmentRow): Equipment {
    return equipmentMapper.toDomain(row)
  }

  async save(model: Equipment): Promise<void> {
    const row = equipmentMapper.toRow(model)

    await this.database
      .insert(equipment)
      .values(row)
      .onConflictDoUpdate({
        target: equipment.id,
        set: {
          name: row.name,
          barGrams: row.barGrams ?? null,
          stackPositions: row.stackPositions ?? null,
          archivedAt: row.archivedAt ?? null,
        },
      })
  }
}
