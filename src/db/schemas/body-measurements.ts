import { relations, sql } from 'drizzle-orm';
import { numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const bodyMeasurements = pgTable('body_measurements', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	weight: numeric('weight', { precision: 5, scale: 2 }), // in kg
	bodyFat: numeric('body_fat', { precision: 4, scale: 2 }), // percentage
	muscleMass: numeric('muscle_mass', { precision: 5, scale: 2 }), // in kg
	height: numeric('height', { precision: 5, scale: 2 }), // in cm
	chest: numeric('chest', { precision: 5, scale: 2 }), // in cm
	waist: numeric('waist', { precision: 5, scale: 2 }), // in cm
	hips: numeric('hips', { precision: 5, scale: 2 }), // in cm
	bicep: numeric('bicep', { precision: 5, scale: 2 }), // in cm
	thigh: numeric('thigh', { precision: 5, scale: 2 }), // in cm
	recordedAt: timestamp('recorded_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
});

export const bodyMeasurementRelations = relations(
	bodyMeasurements,
	({ one }) => ({
		user: one(users, {
			fields: [bodyMeasurements.userId],
			references: [users.id],
		}),
	})
);

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type NewBodyMeasurement = typeof bodyMeasurements.$inferInsert;
