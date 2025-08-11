import { relations, sql } from 'drizzle-orm';
import {
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const exerciseTypeEnum = pgEnum('exercise_type', [
	'strength',
	'cardio',
	'flexibility',
	'balance',
]);

export const equipmentEnum = pgEnum('equipment', [
	'barbell',
	'dumbbell',
	'machine',
	'cable',
	'bodyweight',
	'resistance_band',
	'kettlebell',
	'medicine_ball',
	'treadmill',
	'bike',
	'rowing_machine',
	'other',
]);

export const muscleGroupEnum = pgEnum('muscle_group', [
	'chest',
	'back',
	'shoulders',
	'biceps',
	'triceps',
	'forearms',
	'core',
	'glutes',
	'quadriceps',
	'hamstrings',
	'calves',
	'full_body',
]);

export const exercises = pgTable('exercises', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	type: exerciseTypeEnum('type').notNull(),
	equipment: equipmentEnum('equipment').notNull(),
	primaryMuscleGroup: muscleGroupEnum('primary_muscle_group').notNull(),
	secondaryMuscleGroups: muscleGroupEnum('secondary_muscle_groups').array(),
	instructions: text('instructions'),
	videoUrl: text('video_url'),
	imageUrl: text('image_url'),
	isCustom: integer('is_custom').default(0).notNull(), // 0 = default exercise, 1 = user custom
	createdBy: uuid('created_by').references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
});

export const exerciseRelations = relations(exercises, ({ one }) => ({
	creator: one(users, {
		fields: [exercises.createdBy],
		references: [users.id],
	}),
}));

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
