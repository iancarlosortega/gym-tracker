import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/connection';
import { workouts } from '@/db/schemas';
import { getSession } from '@/features/auth/utils/session';

const createWorkoutSchema = z.object({
	name: z.string().min(1, 'Workout name is required'),
	notes: z.string().optional(),
});

export async function GET() {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userWorkouts = await db
			.select()
			.from(workouts)
			.where(eq(workouts.userId, session.user.id))
			.orderBy(desc(workouts.createdAt));

		return NextResponse.json(userWorkouts);
	} catch (error) {
		console.error('Error fetching workouts:', error);
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
		const validatedData = createWorkoutSchema.parse(body);

		const [newWorkout] = await db
			.insert(workouts)
			.values({
				userId: session.user.id,
				name: validatedData.name,
				notes: validatedData.notes,
			})
			.returning();

		return NextResponse.json(newWorkout, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.issues },
				{ status: 400 }
			);
		}
		console.error('Error creating workout:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
