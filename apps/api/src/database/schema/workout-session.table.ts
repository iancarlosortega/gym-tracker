import { routine } from '@api/database/schema/routine.table.js'
import { appUser } from '@api/database/schema/user.table.js'
import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

export const workoutSession = pgTable(
  'workout_session',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    routineId: uuid('routine_id').references(() => routine.id),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index('workout_session_user_started_idx').on(table.userId, table.startedAt)],
)
