import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/db/connection';
import { exercises, sets, workoutExercises, workouts } from '@/db/schemas';
import { getSession } from '@/features/auth/utils/session';

interface RouteParams {
	params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch workout and check ownership
		const workoutData = await db
			.select({
				id: workouts.id,
				name: workouts.name,
				notes: workouts.notes,
				duration: workouts.duration,
				createdAt: workouts.createdAt,
				updatedAt: workouts.updatedAt,
			})
			.from(workouts)
			.where(
				and(eq(workouts.id, params.id), eq(workouts.userId, session.user.id))
			);

		if (!workoutData.length) {
			return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
		}

		const workout = workoutData[0];

		// Fetch workout exercises with exercise details and sets
		const workoutExerciseData = await db
			.select({
				workoutExerciseId: workoutExercises.id,
				order: workoutExercises.order,
				notes: workoutExercises.notes,
				exerciseId: exercises.id,
				exerciseName: exercises.name,
				primaryMuscleGroup: exercises.primaryMuscleGroup,
				secondaryMuscleGroups: exercises.secondaryMuscleGroups,
				equipment: exercises.equipment,
				instructions: exercises.instructions,
			})
			.from(workoutExercises)
			.leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
			.where(eq(workoutExercises.workoutId, params.id))
			.orderBy(workoutExercises.order);

		// Fetch all sets for this workout
		const workoutSets = await db
			.select()
			.from(sets)
			.leftJoin(
				workoutExercises,
				eq(sets.workoutExerciseId, workoutExercises.id)
			)
			.where(eq(workoutExercises.workoutId, params.id))
			.orderBy(sets.setNumber);

		// Group sets by workout exercise
		const setsByExercise = workoutSets.reduce(
			(acc, row) => {
				const workoutExerciseId = row.workout_exercises?.id;
				if (!workoutExerciseId) return acc;

				if (!acc[workoutExerciseId]) {
					acc[workoutExerciseId] = [];
				}
				if (row.sets) {
					acc[workoutExerciseId].push(row.sets);
				}
				return acc;
			},
			{} as Record<string, Array<typeof sets.$inferSelect>>
		);

		// Build the response structure
		const workoutWithExercises = {
			...workout,
			exercises: workoutExerciseData.map((exercise) => ({
				id: exercise.workoutExerciseId,
				order: exercise.order,
				notes: exercise.notes,
				exercise: {
					id: exercise.exerciseId,
					name: exercise.exerciseName,
					primaryMuscleGroup: exercise.primaryMuscleGroup,
					secondaryMuscleGroups: exercise.secondaryMuscleGroups,
					equipment: exercise.equipment,
					instructions: exercise.instructions,
				},
				sets: setsByExercise[exercise.workoutExerciseId || ''] || [],
			})),
		};

		return NextResponse.json(workoutWithExercises);
	} catch (error) {
		console.error('Error fetching workout details:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
