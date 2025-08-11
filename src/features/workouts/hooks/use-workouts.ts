import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Workout {
	id: string;
	name: string;
	notes?: string;
	duration?: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateWorkoutData {
	name: string;
	notes?: string;
}

// Workout queries
export const useWorkouts = () => {
	return useQuery({
		queryKey: ['workouts'],
		queryFn: async (): Promise<Workout[]> => {
			const response = await fetch('/api/workouts');
			if (!response.ok) {
				throw new Error('Failed to fetch workouts');
			}
			return response.json();
		},
	});
};

export const useCreateWorkout = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateWorkoutData): Promise<Workout> => {
			const response = await fetch('/api/workouts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Failed to create workout');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workouts'] });
		},
	});
};

export function useWorkout(workoutId: string) {
	return useQuery({
		queryKey: ['workout', workoutId],
		queryFn: async () => {
			const response = await fetch(`/api/workouts/${workoutId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch workout');
			}
			return response.json();
		},
		enabled: !!workoutId,
	});
}
