import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const profiles = pgTable('users_profiles', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.unique(),
	displayName: text('displayName'),
	imageId: text('imageId'),
	image: text('image'),
	phone: text('phone'),
	identificationCard: text('identification_card').unique(),
	ruc: text('ruc').unique(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const profileRelations = relations(profiles, ({ one }) => ({
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id],
	}),
}));

export type Profile = typeof profiles.$inferSelect;
