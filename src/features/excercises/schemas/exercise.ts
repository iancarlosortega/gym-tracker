import { z } from 'zod';

// Exercise type options
export const exerciseTypes = [
	'strength',
	'cardio',
	'flexibility',
	'balance',
] as const;

// Equipment options
export const equipmentOptions = [
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
] as const;

// Muscle group options
export const muscleGroups = [
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
] as const;

export const addExerciseSchema = z.object({
	name: z
		.string()
		.min(1, 'Exercise name is required')
		.max(100, 'Exercise name must be less than 100 characters'),
	description: z
		.string()
		.min(1, 'Description is required')
		.max(500, 'Description must be less than 500 characters'),
	type: z.enum(exerciseTypes, {
		message: 'Please select an exercise type',
	}),
	equipment: z.enum(equipmentOptions, {
		message: 'Please select equipment',
	}),
	primaryMuscleGroup: z.enum(muscleGroups, {
		message: 'Please select a primary muscle group',
	}),
	secondaryMuscleGroups: z.array(z.string()).optional(),
	instructions: z
		.string()
		.min(1, 'Instructions are required')
		.max(2000, 'Instructions must be less than 2000 characters'),
	videoUrl: z
		.string()
		.optional()
		.refine(
			(url) => !url || z.url().safeParse(url).success,
			'Please enter a valid URL'
		),
	imageUrl: z
		.string()
		.optional()
		.refine(
			(url) => !url || z.url().safeParse(url).success,
			'Please enter a valid URL'
		),
});

export type AddExerciseFormData = z.infer<typeof addExerciseSchema>;
