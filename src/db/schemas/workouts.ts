import { relations, sql } from 'drizzle-orm';
import {
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { exercises } from './exercises';
import { users } from './users';

export const workouts = pgTable('workouts', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	notes: text('notes'),
	duration: integer('duration'), // duration in minutes
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
});

export const workoutExercises = pgTable('workout_exercises', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	workoutId: uuid('workout_id')
		.notNull()
		.references(() => workouts.id, { onDelete: 'cascade' }),
	exerciseId: uuid('exercise_id')
		.notNull()
		.references(() => exercises.id, { onDelete: 'cascade' }),
	order: integer('order').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
});

export const sets = pgTable('sets', {
	id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
	workoutExerciseId: uuid('workout_exercise_id')
		.notNull()
		.references(() => workoutExercises.id, { onDelete: 'cascade' }),
	setNumber: integer('set_number').notNull(),
	reps: integer('reps'),
	weight: numeric('weight', { precision: 5, scale: 2 }),
	duration: integer('duration'), // duration in seconds for cardio
	distance: numeric('distance', { precision: 8, scale: 2 }), // distance for cardio
	restTime: integer('rest_time'), // rest time in seconds
	completed: integer('completed').default(0).notNull(), // 0 = not completed, 1 = completed
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
});

export const workoutRelations = relations(workouts, ({ one, many }) => ({
	user: one(users, {
		fields: [workouts.userId],
		references: [users.id],
	}),
	exercises: many(workoutExercises),
}));

export const workoutExerciseRelations = relations(
	workoutExercises,
	({ one, many }) => ({
		workout: one(workouts, {
			fields: [workoutExercises.workoutId],
			references: [workouts.id],
		}),
		exercise: one(exercises, {
			fields: [workoutExercises.exerciseId],
			references: [exercises.id],
		}),
		sets: many(sets),
	})
);

export const setRelations = relations(sets, ({ one }) => ({
	workoutExercise: one(workoutExercises, {
		fields: [sets.workoutExerciseId],
		references: [workoutExercises.id],
	}),
}));

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
