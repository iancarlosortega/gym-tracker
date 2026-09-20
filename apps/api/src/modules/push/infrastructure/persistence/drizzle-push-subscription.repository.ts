import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { pushSubscription } from '@api/database/schema/push.table.js'
import { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import type { PushSubscriptionRepository } from '@gym/domain/push/ports/push-subscription.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { Inject, Injectable } from '@nestjs/common'
import { and, count, eq, isNull } from 'drizzle-orm'

type PushSubscriptionRow = typeof pushSubscription.$inferSelect

@Injectable()
export class DrizzlePushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** Keyed on the endpoint: the same device re-subscribing is the same row. */
  async save(subscription: PushSubscription): Promise<void> {
    await this.database
      .insert(pushSubscription)
      .values({
        id: subscription.id.value,
        userId: subscription.userId.value,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        invalidatedAt: subscription.invalidatedOn,
      })
      .onConflictDoUpdate({
        target: pushSubscription.endpoint,
        set: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          invalidatedAt: subscription.invalidatedOn,
        },
      })
  }

  async findValidForUser(userId: string): Promise<readonly PushSubscription[]> {
    const rows = await this.database
      .select()
      .from(pushSubscription)
      .where(and(eq(pushSubscription.userId, userId), isNull(pushSubscription.invalidatedAt)))

    return (rows as PushSubscriptionRow[]).map(toDomain)
  }

  async countForUser(userId: string): Promise<number> {
    const rows = await this.database
      .select({ total: count() })
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId))

    return rows[0]?.total ?? 0
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const rows = await this.database
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))
      .limit(1)

    const row = rows[0] as PushSubscriptionRow | undefined
    return row === undefined ? null : toDomain(row)
  }
}

const toDomain = (row: PushSubscriptionRow): PushSubscription =>
  PushSubscription.restore({
    id: Id.restore(row.id),
    userId: Id.restore(row.userId),
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    invalidatedOn: row.invalidatedAt,
  })
