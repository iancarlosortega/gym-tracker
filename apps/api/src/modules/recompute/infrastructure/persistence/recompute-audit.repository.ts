import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import { recomputeAudit } from '@api/database/schema/recompute-audit.table.js'
import type { RecomputeDiff } from '@gym/domain/recompute/value-objects/recompute-diff.vo'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

export interface RecomputeAudit {
  apply(userId: string, diff: RecomputeDiff): Promise<void>
}

/**
 * Rewrites the affected sets and records what it rewrote.
 *
 * One transaction: a correction that applied to half the history and then
 * failed would leave the user with a history that is wrong in a new and less
 * explicable way. The audit row is written inside it too, so there is no
 * state where sets changed and nothing says why.
 *
 * Only `resolved_grams` moves. The raw value the user typed and the mode they
 * typed it in are what was true at the rack; the snapshot bar weight stays as
 * well, because it records what the set meant when it was logged.
 */
@Injectable()
export class DrizzleRecomputeAudit implements RecomputeAudit {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async apply(userId: string, diff: RecomputeDiff): Promise<void> {
    await this.database.transaction(async (transaction) => {
      for (const change of diff.changes) {
        await transaction
          .update(loggedSet)
          .set({ resolvedGrams: change.recomputedGrams })
          .where(eq(loggedSet.id, change.setId))
      }

      await transaction.insert(recomputeAudit).values({
        userId,
        equipmentId: diff.equipmentId,
        previewToken: diff.token,
        affectedSets: diff.changes.length,
        changes: diff.changes.map((change) => ({
          setId: change.setId,
          from: change.currentGrams,
          to: change.recomputedGrams,
        })),
      })
    })
  }
}
