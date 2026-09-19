import { appUser } from '@api/database/schema/user.table.js'
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const pushSubscription = pgTable(
  'push_subscription',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    /** Set when the push service reports the subscription gone. */
    invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('push_subscription_user_idx').on(table.userId)],
)

/**
 * A rest-end notification waiting to be sent.
 *
 * Durable rather than an in-process timer: a deploy or crash during a three
 * minute rest would silently drop a setTimeout, and the user would be standing
 * in the gym waiting for an alert that is never coming.
 */
export const scheduledPush = pgTable(
  'scheduled_push',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    setId: uuid('set_id').notNull(),
    fireAt: timestamp('fire_at', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('scheduled_push_due_idx').on(table.fireAt)],
)
