import { desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/connection';
import { bodyMeasurements } from '@/db/schemas';
import { getSession } from '@/features/auth/utils/session';

const createMeasurementSchema = z.object({
	weight: z.number().positive().optional(),
	bodyFat: z.number().min(0).max(100).optional(),
	muscleMass: z.number().positive().optional(),
	height: z.number().positive().optional(),
	chest: z.number().positive().optional(),
	waist: z.number().positive().optional(),
	hips: z.number().positive().optional(),
	bicep: z.number().positive().optional(),
	thigh: z.number().positive().optional(),
	recordedAt: z.string().datetime().optional(),
});

export async function GET() {
	try {
		const session = await getSession();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const measurements = await db
			.select()
			.from(bodyMeasurements)
			.where(eq(bodyMeasurements.userId, session.user.id))
			.orderBy(desc(bodyMeasurements.recordedAt));

		return NextResponse.json(measurements);
	} catch (error) {
		console.error('Error fetching body measurements:', error);
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
		const validatedData = createMeasurementSchema.parse(body);

		const measurementData = {
			userId: session.user.id,
			weight: validatedData.weight?.toString(),
			bodyFat: validatedData.bodyFat?.toString(),
			muscleMass: validatedData.muscleMass?.toString(),
			height: validatedData.height?.toString(),
			chest: validatedData.chest?.toString(),
			waist: validatedData.waist?.toString(),
			hips: validatedData.hips?.toString(),
			bicep: validatedData.bicep?.toString(),
			thigh: validatedData.thigh?.toString(),
			recordedAt: validatedData.recordedAt
				? new Date(validatedData.recordedAt)
				: new Date(),
		};

		const [newMeasurement] = await db
			.insert(bodyMeasurements)
			.values(measurementData)
			.returning();

		return NextResponse.json(newMeasurement, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data', details: error.issues },
				{ status: 400 }
			);
		}
		console.error('Error creating body measurement:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
