import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const accountTypeEnum = pgEnum('account_type', ['email', 'google']);

export const accounts = pgTable('users_accounts', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accountType: accountTypeEnum('accountType').notNull(),
	googleId: text('google_id').unique(),
	password: text('password'),
	salt: text('salt'),
});

export type Account = typeof accounts.$inferSelect;
