import { z } from 'zod';

export const measurementsSchema = z.object({
	weight: z.string().optional(),
	bodyFat: z.string().optional(),
	height: z.string().optional(),
	chest: z.string().optional(),
	waist: z.string().optional(),
	hips: z.string().optional(),
	bicep: z.string().optional(),
	thigh: z.string().optional(),
});

export type MeasurementsFormData = z.infer<typeof measurementsSchema>;
