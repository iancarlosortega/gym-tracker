/** How much a piece of equipment has been used: by how many exercises, across how many sets. */
export interface EquipmentUsage {
  readonly exercises: number
  readonly sets: number
}

/**
 * Reads usage from logged sets, scoped to their owner.
 *
 * Counting is all it does: it answers "how much would a bar-weight correction
 * touch" without loading the sets themselves.
 */
export interface EquipmentUsageRepository {
  usageOf(userId: string, equipmentId: string): Promise<EquipmentUsage>
}
