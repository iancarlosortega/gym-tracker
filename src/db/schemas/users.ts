import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { USER_ROLES, USER_ROLES_ARRAY } from '@/features/auth/constants/user';
import { accounts } from './accounts';
import { profiles } from './profiles';

export const rolesTypeEnum = pgEnum('roles', USER_ROLES_ARRAY);

export const users = pgTable('users', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	email: text('email').unique(),
	emailVerifiedAt: timestamp('email_verified_at', {
		mode: 'date',
		withTimezone: true,
	}),
	isActive: boolean('is_active').default(true).notNull(),
	isNewUser: boolean('is_new_user').default(true).notNull(),
	role: rolesTypeEnum('role').default(USER_ROLES.USER.value).notNull(),
});

export const sessions = pgTable('users_sessions', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date',
	}).notNull(),
});

export const userRelations = relations(users, ({ one }) => ({
	profile: one(profiles, {
		fields: [users.id],
		references: [profiles.userId],
	}),
	account: one(accounts, {
		fields: [users.id],
		references: [accounts.userId],
	}),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
