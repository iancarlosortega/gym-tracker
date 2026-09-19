import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { appUser } from './user.table.ts'

/** Server-held authentication sessions. The cookie carries only this opaque id. */
export const authSession = pgTable(
  'auth_session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('auth_session_user_idx').on(table.userId)],
)
