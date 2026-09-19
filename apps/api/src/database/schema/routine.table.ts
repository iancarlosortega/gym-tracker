import { equipment } from '@api/database/schema/equipment.table.js'
import { exercise } from '@api/database/schema/exercise.table.js'
import { appUser } from '@api/database/schema/user.table.js'
import { sql } from 'drizzle-orm'
import { check, integer, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const routine = pgTable('routine', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const routineExercise = pgTable(
  'routine_exercise',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routine.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercise.id),
    equipmentId: uuid('equipment_id').references(() => equipment.id),
    position: smallint('position').notNull(),
    targetSets: smallint('target_sets'),
    targetRepsMin: smallint('target_reps_min'),
    targetRepsMax: smallint('target_reps_max'),
    restSeconds: integer('rest_seconds').notNull().default(180),
  },
  (table) => [
    check('routine_exercise_rest_positive', sql`${table.restSeconds} > 0`),
    check(
      'routine_exercise_rep_range_ordered',
      sql`${table.targetRepsMin} IS NULL OR ${table.targetRepsMax} IS NULL OR ${table.targetRepsMin} <= ${table.targetRepsMax}`,
    ),
  ],
)
