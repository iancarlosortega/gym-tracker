import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Exercise {
	id: string;
	name: string;
	description?: string;
	type: 'strength' | 'cardio' | 'flexibility' | 'balance';
	equipment: string;
	primaryMuscleGroup: string;
	secondaryMuscleGroups?: string[];
	instructions?: string;
	videoUrl?: string;
	imageUrl?: string;
	isCustom: number;
	createdBy?: string;
	createdAt: string;
	updatedAt: string;
}

// Exercise queries
export const useExercises = (filters?: {
	search?: string;
	type?: string;
	muscleGroup?: string;
}) => {
	return useQuery({
		queryKey: ['exercises', filters],
		queryFn: async (): Promise<Exercise[]> => {
			const searchParams = new URLSearchParams();

			if (filters?.search) {
				searchParams.append('search', filters.search);
			}
			if (filters?.type) {
				searchParams.append('type', filters.type);
			}
			if (filters?.muscleGroup) {
				searchParams.append('muscleGroup', filters.muscleGroup);
			}

			const response = await fetch(`/api/exercises?${searchParams}`);
			if (!response.ok) {
				throw new Error('Failed to fetch exercises');
			}
			return response.json();
		},
	});
};

// Create exercise mutation
export const useCreateExercise = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			exerciseData: Omit<
				Exercise,
				'id' | 'isCustom' | 'createdBy' | 'createdAt' | 'updatedAt'
			>
		) => {
			const response = await fetch('/api/exercises', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(exerciseData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create exercise');
			}

			return response.json();
		},
		onSuccess: () => {
			// Invalidate and refetch exercises
			queryClient.invalidateQueries({ queryKey: ['exercises'] });
		},
	});
};
