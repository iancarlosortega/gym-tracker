import { appUser } from '@api/database/schema/user.table.js'
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** What a confirmed history recomputation actually changed. */
export const recomputeAudit = pgTable('recompute_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUser.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id').notNull(),
  previewToken: text('preview_token').notNull(),
  affectedSets: integer('affected_sets').notNull(),
  changes: jsonb('changes').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
})
