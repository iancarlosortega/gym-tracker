import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import type {
  EquipmentUsage,
  EquipmentUsageRepository,
} from '@gym/domain/catalog/repositories/equipment-usage.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, countDistinct, count as countRows, eq, isNull } from 'drizzle-orm'

/**
 * Counts live sets on a piece of equipment, scoped to their owner.
 *
 * Ownership lives on the session rather than on the set, so the count joins
 * through it, the same way the statistics reads do.
 */
@Injectable()
export class DrizzleEquipmentUsageRepository implements EquipmentUsageRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async usageOf(userId: string, equipmentId: string): Promise<EquipmentUsage> {
    const [row] = await this.database
      .select({
        exercises: countDistinct(loggedSet.exerciseId),
        sets: countRows(loggedSet.id),
      })
      .from(loggedSet)
      .innerJoin(workoutSession, eq(workoutSession.id, loggedSet.sessionId))
      .where(
        and(
          eq(workoutSession.userId, userId),
          eq(loggedSet.equipmentId, equipmentId),
          isNull(loggedSet.deletedAt),
        ),
      )

    return { exercises: Number(row?.exercises ?? 0), sets: Number(row?.sets ?? 0) }
  }
}
