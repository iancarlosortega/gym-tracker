import { equipment } from '@api/database/schema/equipment.table.js'
import { exercise } from '@api/database/schema/exercise.table.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const loggedSet = pgTable(
  'logged_set',
  {
    /** UUIDv7 generated on the device; also the sync idempotency key. */
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSession.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercise.id),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id),

    mode: text('mode', { enum: ['TOTAL', 'PER_SIDE', 'STACK_POSITION'] }).notNull(),

    /** Exactly what the user typed, in its own unit. */
    rawValue: integer('raw_value').notNull(),
    rawUnit: text('raw_unit', { enum: ['KG', 'LB'] }),

    /** Whole grams. Always NULL for STACK_POSITION — an ordinal has no mass. */
    resolvedGrams: bigint('resolved_grams', { mode: 'number' }),

    /** The stack position. Non-null only for STACK_POSITION. */
    stackPosition: smallint('stack_position'),

    /** The bar weight used at log time, so equipment edits cannot rewrite history. */
    snapshotBarGrams: bigint('snapshot_bar_grams', { mode: 'number' }),
    snapshotDisplayUnit: text('snapshot_display_unit', { enum: ['KG', 'LB'] }).notNull(),

    reps: smallint('reps').notNull(),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull(),

    /** Ordering counter for corrections; sync resolves replays with it. */
    revision: integer('revision').notNull().default(0),

    /** Soft delete, so a replayed create cannot resurrect a deleted set. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    syncedAt: timestamp('synced_at', { withTimezone: true }),
  },
  (table) => [
    /**
     * The invariant that protects every statistic in the product: a row either
     * carries a mass or an ordinal position, never both and never neither.
     *
     * Enforced here rather than only in application code because application
     * code gets refactored and a constraint does not.
     */
    check(
      'logged_set_mass_xor_position',
      sql`(${table.resolvedGrams} IS NOT NULL AND ${table.stackPosition} IS NULL)
          OR (${table.resolvedGrams} IS NULL AND ${table.stackPosition} IS NOT NULL)`,
    ),
    /** An ordinal set has no bar and no display unit for a mass it does not have. */
    check(
      'logged_set_ordinal_has_no_bar',
      sql`${table.mode} <> 'STACK_POSITION' OR ${table.snapshotBarGrams} IS NULL`,
    ),
    /** A per-side set cannot resolve without the bar weight it was logged against. */
    check(
      'logged_set_per_side_has_bar',
      sql`${table.mode} <> 'PER_SIDE' OR ${table.snapshotBarGrams} IS NOT NULL`,
    ),
    check('logged_set_reps_positive', sql`${table.reps} >= 1`),
    check('logged_set_revision_non_negative', sql`${table.revision} >= 0`),
    index('logged_set_exercise_logged_at_idx').on(table.exerciseId, table.loggedAt),
    index('logged_set_session_idx').on(table.sessionId),
  ],
)
