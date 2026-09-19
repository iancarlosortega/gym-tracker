import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { routine } from './routine.table.ts'
import { appUser } from './user.table.ts'

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
