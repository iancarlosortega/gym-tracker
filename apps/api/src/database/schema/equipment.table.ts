import { appUser } from '@api/database/schema/user.table.js'
import { sql } from 'drizzle-orm'
import { bigint, check, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['BARBELL', 'STACK', 'FREE_WEIGHT'] }).notNull(),

    /** Required for barbells, meaningless for a stack. */
    barGrams: bigint('bar_grams', { mode: 'number' }),

    /** Required for stacks: how many positions the pin can occupy. */
    stackPositions: smallint('stack_positions'),

    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'equipment_barbell_has_bar',
      sql`${table.kind} <> 'BARBELL' OR ${table.barGrams} IS NOT NULL`,
    ),
    check(
      'equipment_stack_has_positions',
      sql`${table.kind} <> 'STACK' OR ${table.stackPositions} IS NOT NULL`,
    ),
  ],
)
