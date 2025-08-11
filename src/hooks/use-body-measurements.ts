import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface BodyMeasurement {
	id: string;
	weight?: string;
	bodyFat?: string;
	muscleMass?: string;
	height?: string;
	chest?: string;
	waist?: string;
	hips?: string;
	bicep?: string;
	thigh?: string;
	recordedAt: string;
	createdAt: string;
}

export interface CreateMeasurementData {
	weight?: number;
	bodyFat?: number;
	muscleMass?: number;
	height?: number;
	chest?: number;
	waist?: number;
	hips?: number;
	bicep?: number;
	thigh?: number;
	recordedAt?: string;
}

// Body measurement queries
export const useBodyMeasurements = () => {
	return useQuery({
		queryKey: ['body-measurements'],
		queryFn: async (): Promise<BodyMeasurement[]> => {
			const response = await fetch('/api/body-measurements');
			if (!response.ok) {
				throw new Error('Failed to fetch body measurements');
			}
			return response.json();
		},
	});
};

export const useCreateBodyMeasurement = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: CreateMeasurementData
		): Promise<BodyMeasurement> => {
			const response = await fetch('/api/body-measurements', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Failed to create body measurement');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['body-measurements'] });
		},
	});
};
