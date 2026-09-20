import type { scheduledPush } from '@api/database/schema/push.table.js'
import { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type ScheduledPushRow = typeof scheduledPush.$inferSelect
type ScheduledPushInsert = typeof scheduledPush.$inferInsert

export const scheduledPushMapper = {
  toDomain(row: ScheduledPushRow): ScheduledPush {
    return ScheduledPush.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      setId: Id.restore(row.setId),
      fireAt: row.fireAt,
      sentOn: row.sentAt,
    })
  },

  toRow(push: ScheduledPush): ScheduledPushInsert {
    return {
      id: push.id.value,
      userId: push.userId.value,
      setId: push.setId.value,
      fireAt: push.fireAt,
      sentAt: push.sentOn,
    }
  },
}
