import { appUser } from '@api/database/schema/user.table.js'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const exercise = pgTable('exercise', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  defaultMode: text('default_mode', { enum: ['TOTAL', 'PER_SIDE', 'STACK_POSITION'] }).notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
