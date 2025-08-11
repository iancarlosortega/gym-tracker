import { db } from './connection';
import { exercises } from './schemas';

type MuscleGroup =
	| 'chest'
	| 'back'
	| 'shoulders'
	| 'biceps'
	| 'triceps'
	| 'forearms'
	| 'core'
	| 'glutes'
	| 'quadriceps'
	| 'hamstrings'
	| 'calves'
	| 'full_body';
type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'balance';
type Equipment =
	| 'barbell'
	| 'dumbbell'
	| 'machine'
	| 'cable'
	| 'bodyweight'
	| 'resistance_band'
	| 'kettlebell'
	| 'medicine_ball'
	| 'treadmill'
	| 'bike'
	| 'rowing_machine'
	| 'other';

const defaultExercises: Array<{
	name: string;
	description: string;
	type: ExerciseType;
	equipment: Equipment;
	primaryMuscleGroup: MuscleGroup;
	secondaryMuscleGroups?: MuscleGroup[];
	instructions: string;
	isCustom: number;
}> = [
	// Chest Exercises
	{
		name: 'Bench Press',
		description:
			'A compound upper body exercise that targets the chest, shoulders, and triceps.',
		type: 'strength',
		equipment: 'barbell',
		primaryMuscleGroup: 'chest',
		secondaryMuscleGroups: ['shoulders', 'triceps'],
		instructions:
			'Lie on a bench, grip the barbell with hands slightly wider than shoulder-width apart. Lower the bar to your chest, then press it back up.',
		isCustom: 0,
	},
	{
		name: 'Push-ups',
		description:
			'A bodyweight exercise that targets the chest, shoulders, and triceps.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'chest',
		secondaryMuscleGroups: ['shoulders', 'triceps'],
		instructions:
			'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.',
		isCustom: 0,
	},
	{
		name: 'Dumbbell Flyes',
		description: 'An isolation exercise that targets the chest muscles.',
		type: 'strength',
		equipment: 'dumbbell',
		primaryMuscleGroup: 'chest',
		secondaryMuscleGroups: [],
		instructions:
			'Lie on a bench with dumbbells in each hand. Lower the weights in a wide arc until you feel a stretch in your chest, then bring them back together.',
		isCustom: 0,
	},

	// Back Exercises
	{
		name: 'Pull-ups',
		description: 'A bodyweight exercise that targets the back and biceps.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'back',
		secondaryMuscleGroups: ['biceps'],
		instructions:
			'Hang from a pull-up bar with hands slightly wider than shoulder-width. Pull your body up until your chin is above the bar.',
		isCustom: 0,
	},
	{
		name: 'Deadlift',
		description:
			'A compound exercise that works multiple muscle groups including the back, glutes, and hamstrings.',
		type: 'strength',
		equipment: 'barbell',
		primaryMuscleGroup: 'back',
		secondaryMuscleGroups: ['glutes', 'hamstrings'],
		instructions:
			'Stand with feet hip-width apart, grip the barbell with hands outside your legs. Lift by driving through your heels and extending your hips.',
		isCustom: 0,
	},
	{
		name: 'Bent-over Rows',
		description: 'A compound exercise that targets the upper back and lats.',
		type: 'strength',
		equipment: 'barbell',
		primaryMuscleGroup: 'back',
		secondaryMuscleGroups: ['biceps'],
		instructions:
			'Hinge at the hips, keep your back straight, and row the barbell to your lower chest.',
		isCustom: 0,
	},

	// Leg Exercises
	{
		name: 'Squats',
		description:
			'A compound lower body exercise that targets the quadriceps, glutes, and hamstrings.',
		type: 'strength',
		equipment: 'barbell',
		primaryMuscleGroup: 'quadriceps',
		secondaryMuscleGroups: ['glutes', 'hamstrings'],
		instructions:
			'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair, then drive through your heels to stand.',
		isCustom: 0,
	},
	{
		name: 'Lunges',
		description:
			'A unilateral leg exercise that targets the quadriceps and glutes.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'quadriceps',
		secondaryMuscleGroups: ['glutes'],
		instructions:
			'Step forward with one leg, lower your hips until both knees are bent at 90 degrees, then return to starting position.',
		isCustom: 0,
	},

	// Shoulder Exercises
	{
		name: 'Overhead Press',
		description: 'A compound exercise that targets the shoulders and triceps.',
		type: 'strength',
		equipment: 'barbell',
		primaryMuscleGroup: 'shoulders',
		secondaryMuscleGroups: ['triceps'],
		instructions:
			'Stand with feet shoulder-width apart, press the barbell from shoulder height straight up overhead.',
		isCustom: 0,
	},
	{
		name: 'Lateral Raises',
		description: 'An isolation exercise that targets the side deltoids.',
		type: 'strength',
		equipment: 'dumbbell',
		primaryMuscleGroup: 'shoulders',
		secondaryMuscleGroups: [],
		instructions:
			'Hold dumbbells at your sides, raise them laterally until your arms are parallel to the floor.',
		isCustom: 0,
	},

	// Arm Exercises
	{
		name: 'Bicep Curls',
		description: 'An isolation exercise that targets the biceps.',
		type: 'strength',
		equipment: 'dumbbell',
		primaryMuscleGroup: 'biceps',
		secondaryMuscleGroups: [],
		instructions:
			'Hold dumbbells with arms extended, curl the weights up by flexing your biceps.',
		isCustom: 0,
	},
	{
		name: 'Tricep Dips',
		description: 'A bodyweight exercise that targets the triceps.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'triceps',
		secondaryMuscleGroups: [],
		instructions:
			'Support your body on parallel bars or a bench, lower your body by bending your elbows, then push back up.',
		isCustom: 0,
	},

	// Core Exercises
	{
		name: 'Plank',
		description: 'An isometric exercise that targets the core muscles.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'core',
		secondaryMuscleGroups: [],
		instructions:
			'Hold a push-up position with your body in a straight line from head to heels.',
		isCustom: 0,
	},
	{
		name: 'Russian Twists',
		description: 'A core exercise that targets the obliques.',
		type: 'strength',
		equipment: 'bodyweight',
		primaryMuscleGroup: 'core',
		secondaryMuscleGroups: [],
		instructions:
			'Sit with knees bent, lean back slightly, and rotate your torso from side to side.',
		isCustom: 0,
	},

	// Cardio Exercises
	{
		name: 'Treadmill Running',
		description: 'A cardiovascular exercise performed on a treadmill.',
		type: 'cardio',
		equipment: 'treadmill',
		primaryMuscleGroup: 'full_body',
		secondaryMuscleGroups: [],
		instructions:
			'Run or walk at your desired pace and incline on the treadmill.',
		isCustom: 0,
	},
	{
		name: 'Stationary Bike',
		description: 'A low-impact cardiovascular exercise.',
		type: 'cardio',
		equipment: 'bike',
		primaryMuscleGroup: 'quadriceps',
		secondaryMuscleGroups: ['glutes', 'calves'],
		instructions: 'Pedal at a steady pace while maintaining proper posture.',
		isCustom: 0,
	},
];

async function seedExercises() {
	console.log('Seeding exercises...');

	try {
		await db.insert(exercises).values(defaultExercises);
		console.log(`Seeded ${defaultExercises.length} exercises successfully`);
	} catch (error) {
		console.error('Error seeding exercises:', error);
	}
}

if (require.main === module) {
	seedExercises().then(() => {
		process.exit(0);
	});
}

export { seedExercises };
