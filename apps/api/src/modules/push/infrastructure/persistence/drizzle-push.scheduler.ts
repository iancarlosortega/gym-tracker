import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { scheduledPush } from '@api/database/schema/push.table.js'
import type { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import type { PushScheduler } from '@gym/domain/push/ports/push-scheduler.port'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, isNull, lte, sql } from 'drizzle-orm'
import { scheduledPushMapper } from './scheduled-push.mapper.js'

type ScheduledPushRow = typeof scheduledPush.$inferSelect

/**
 * Rest alerts kept in Postgres, claimed one sender at a time.
 *
 * `FOR UPDATE SKIP LOCKED` is the whole design. Two API processes ticking on
 * the same second both ask for due rows; the first locks what it takes and
 * the second walks past those rows rather than blocking on them, so every
 * alert is sent exactly once and neither process waits. Without SKIP LOCKED
 * the second tick would queue behind the first and then send the same buzz
 * again.
 *
 * The claim and the send are deliberately not one transaction: holding a row
 * lock across a call to a push service on the public internet would be
 * holding a database lock for as long as that service felt like taking.
 */
@Injectable()
export class DrizzlePushScheduler implements PushScheduler {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async schedule(push: ScheduledPush): Promise<void> {
    await this.database.insert(scheduledPush).values(scheduledPushMapper.toRow(push))
  }

  async cancelForSet(setId: string): Promise<void> {
    await this.database
      .delete(scheduledPush)
      .where(and(eq(scheduledPush.setId, setId), isNull(scheduledPush.sentAt)))
  }

  async claimDue(instant: Date, limit: number): Promise<readonly ScheduledPush[]> {
    return await this.database.transaction(async (transaction) => {
      const rows = await transaction
        .select()
        .from(scheduledPush)
        .where(and(isNull(scheduledPush.sentAt), lte(scheduledPush.fireAt, instant)))
        .orderBy(scheduledPush.fireAt)
        .limit(limit)
        .for('update', { skipLocked: true })

      return (rows as ScheduledPushRow[]).map((row) => scheduledPushMapper.toDomain(row))
    })
  }

  /**
   * Stamped rather than deleted.
   *
   * A sent row is the evidence that the buzz went out; deleting it would make
   * a duplicate delivery indistinguishable from a first one.
   */
  async markSent(push: ScheduledPush): Promise<void> {
    await this.database
      .update(scheduledPush)
      .set({ sentAt: push.sentOn ?? sql`now()` })
      .where(eq(scheduledPush.id, push.id.value))
  }
}
