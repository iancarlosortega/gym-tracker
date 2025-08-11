import { db } from './connection';
import { sets, workoutExercises, workouts } from './schemas';

export async function seedWorkouts() {
	console.log('Starting workout seeding...');

	try {
		// This is a test seed - in a real app you'd need user authentication
		// For now, let's assume we have a user ID (you'd replace this with actual user ID)
		const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Replace with actual user ID

		// Create a test workout
		const [workout] = await db
			.insert(workouts)
			.values({
				userId: testUserId,
				name: 'Upper Body Strength',
				notes: 'Focus on progressive overload with compound movements',
				duration: 75, // 75 minutes
			})
			.returning();

		console.log('Created workout:', workout.id);

		// Add exercises to the workout
		const exerciseIds = [
			'550e8400-e29b-41d4-a716-446655440001', // Bench Press (you'd replace with actual exercise IDs)
			'550e8400-e29b-41d4-a716-446655440002', // Pull-ups
		];

		const workoutExerciseData = [];
		for (let i = 0; i < exerciseIds.length; i++) {
			const [workoutExercise] = await db
				.insert(workoutExercises)
				.values({
					workoutId: workout.id,
					exerciseId: exerciseIds[i],
					order: i + 1,
				})
				.returning();

			workoutExerciseData.push(workoutExercise);
		}

		// Add sets for each exercise
		for (const workoutExercise of workoutExerciseData) {
			const setData = [];

			// Create 3 sets for each exercise
			for (let setNumber = 1; setNumber <= 3; setNumber++) {
				setData.push({
					workoutExerciseId: workoutExercise.id,
					setNumber,
					reps: setNumber === 1 ? 10 : setNumber === 2 ? 8 : 6,
					weight: setNumber === 1 ? '135' : setNumber === 2 ? '145' : '155',
					completed: setNumber <= 2 ? 1 : 0, // First 2 sets completed
				});
			}

			await db.insert(sets).values(setData);
		}

		console.log('Workout seeding completed successfully!');
	} catch (error) {
		console.error('Error seeding workouts:', error);
		throw error;
	}
}

// Run the seeding if this file is executed directly
if (require.main === module) {
	seedWorkouts()
		.then(() => {
			console.log('Seeding finished');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Seeding failed:', error);
			process.exit(1);
		});
}
