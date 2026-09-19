import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayUnit: text('display_unit', { enum: ['KG', 'LB'] })
    .notNull()
    .default('KG'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
