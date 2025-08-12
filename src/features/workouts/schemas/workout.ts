import { z } from 'zod';

export const workoutSchema = z.object({
	name: z
		.string()
		.min(1, 'Workout name is required')
		.max(100, 'Workout name must be less than 100 characters'),
	notes: z
		.string()
		.max(1000, 'Notes must be less than 1000 characters')
		.optional(),
});

export const exerciseSetSchema = z.object({
	reps: z.number().min(1, 'Reps must be at least 1'),
	weight: z.string().optional(),
	notes: z.string().optional(),
});

export const selectedExerciseSchema = z.object({
	id: z.string(),
	name: z.string(),
	primaryMuscleGroup: z.string(),
	equipment: z.string(),
	sets: z.array(exerciseSetSchema).min(1, 'At least one set is required'),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;
export type ExerciseSetFormData = z.infer<typeof exerciseSetSchema>;
export type SelectedExerciseFormData = z.infer<typeof selectedExerciseSchema>;
