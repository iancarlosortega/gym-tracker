import { and, eq, ilike, or } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/connection';
import { exercises } from '@/db/schemas';
import { getSession } from '@/features/auth/utils/session';

const createExerciseSchema = z.object({
	name: z.string().min(1, 'Exercise name is required'),
	description: z.string().optional(),
	type: z.enum(['strength', 'cardio', 'flexibility', 'balance']),
	equipment: z.enum([
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
	]),
	primaryMuscleGroup: z.enum([
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
	]),
	secondaryMuscleGroups: z
		.array(
			z.enum([
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
			])
		)
		.optional(),
	instructions: z.string().optional(),
	videoUrl: z.string().url().optional().or(z.literal('')),
	imageUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get('search');
		const type = searchParams.get('type');
		const muscleGroup = searchParams.get('muscleGroup');

		const query = db.select().from(exercises);

		// Build where conditions
		const conditions: any[] = [
			or(eq(exercises.isCustom, 0), eq(exercises.createdBy, session.user.id)),
		];

		if (search) {
			conditions.push(ilike(exercises.name, `%${search}%`));
		}

		if (
			type &&
			['strength', 'cardio', 'flexibility', 'balance'].includes(type)
		) {
			conditions.push(
				eq(
					exercises.type,
					type as 'strength' | 'cardio' | 'flexibility' | 'balance'
				)
			);
		}

		if (
			muscleGroup &&
			[
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
			].includes(muscleGroup)
		) {
			conditions.push(
				eq(
					exercises.primaryMuscleGroup,
					muscleGroup as
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
						| 'full_body'
				)
			);
		}

		const result = await query.where(
			conditions.length === 1
				? conditions[0]
				: conditions.length > 1
					? and(...conditions)
					: undefined
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error fetching exercises:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = createExerciseSchema.parse(body);

		const [newExercise] = await db
			.insert(exercises)
			.values({
				...validatedData,
				isCustom: 1,
				createdBy: session.user.id,
			})
			.returning();

		return NextResponse.json(newExercise, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.issues },
				{ status: 400 }
			);
		}
		console.error('Error creating exercise:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
