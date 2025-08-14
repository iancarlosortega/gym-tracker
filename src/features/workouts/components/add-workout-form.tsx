'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { useExercises } from '@/features/excercises/hooks/use-exercises';
import { Button } from '@/features/shared/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/features/shared/components/form';
import { Input } from '@/features/shared/components/input';
import { Textarea } from '@/features/shared/components/textarea';
import { useCreateWorkout } from '@/features/workouts/hooks/use-workouts';
import type {
	ExerciseSetFormData,
	SelectedExerciseFormData,
	WorkoutFormData,
} from '@/features/workouts/schemas/workout';
import { workoutSchema } from '@/features/workouts/schemas/workout';
import { type Exercise, ExerciseSearch } from './exercise-search';
import { SelectedExercisesList } from './selected-exercises-list';

interface AddWorkoutFormProps {
	onSuccess?: (workoutId: string) => void;
	onCancel?: () => void;
}

export function AddWorkoutForm({ onSuccess, onCancel }: AddWorkoutFormProps) {
	const [selectedExercises, setSelectedExercises] = useState<
		SelectedExerciseFormData[]
	>([]);
	const [showExerciseSearch, setShowExerciseSearch] = useState(false);

	const createWorkout = useCreateWorkout();
	const { data: exercises = [] } = useExercises();

	const form = useForm<WorkoutFormData>({
		resolver: zodResolver(workoutSchema),
		defaultValues: {
			name: '',
			notes: '',
		},
	});

	const onSubmit = async (data: WorkoutFormData) => {
		try {
			const workout = await createWorkout.mutateAsync({
				name: data.name.trim(),
				notes: data.notes?.trim() || undefined,
			});

			// Reset form and call success callback
			form.reset();
			setSelectedExercises([]);
			onSuccess?.(workout.id);
		} catch (error) {
			console.error('Failed to create workout:', error);
		}
	};

	const addExercise = (exercise: Exercise) => {
		if (!selectedExercises.find((e) => e.id === exercise.id)) {
			setSelectedExercises([
				...selectedExercises,
				{
					...exercise,
					sets: [{ reps: 10, weight: '', notes: '' }],
				},
			]);
		}
		setShowExerciseSearch(false);
	};

	const removeExercise = (exerciseId: string) => {
		setSelectedExercises(selectedExercises.filter((e) => e.id !== exerciseId));
	};

	const addSet = (exerciseId: string) => {
		setSelectedExercises(
			selectedExercises.map((exercise) =>
				exercise.id === exerciseId
					? {
							...exercise,
							sets: [...exercise.sets, { reps: 10, weight: '', notes: '' }],
						}
					: exercise
			)
		);
	};

	const updateSet = (
		exerciseId: string,
		setIndex: number,
		field: keyof ExerciseSetFormData,
		value: string | number
	) => {
		setSelectedExercises(
			selectedExercises.map((exercise) =>
				exercise.id === exerciseId
					? {
							...exercise,
							sets: exercise.sets.map((set, index) =>
								index === setIndex ? { ...set, [field]: value } : set
							),
						}
					: exercise
			)
		);
	};

	const removeSet = (exerciseId: string, setIndex: number) => {
		setSelectedExercises(
			selectedExercises.map((exercise) =>
				exercise.id === exerciseId
					? {
							...exercise,
							sets: exercise.sets.filter((_, index) => index !== setIndex),
						}
					: exercise
			)
		);
	};

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle>Workout Details</CardTitle>
							<CardDescription>
								Enter the basic information for your workout session
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Workout Name <span className='text-red-500'>*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder='e.g., Upper Body Strength, Morning Cardio'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='notes'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes (Optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder='Any additional notes about this workout...'
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Exercise Selection */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Exercises</CardTitle>
									<CardDescription>
										Add exercises to your workout plan
									</CardDescription>
								</div>
								<Button
									type='button'
									variant='outline'
									onClick={() => setShowExerciseSearch(true)}>
									<FiPlus className='w-4 h-4 mr-2' />
									Add Exercise
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<SelectedExercisesList
								selectedExercises={selectedExercises}
								onRemoveExercise={removeExercise}
								onAddSet={addSet}
								onUpdateSet={updateSet}
								onRemoveSet={removeSet}
							/>
						</CardContent>
					</Card>

					{/* Form Actions */}
					<div className='flex justify-end space-x-4'>
						<Button
							type='button'
							variant='outline'
							onClick={onCancel}
							disabled={createWorkout.isPending}>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={!form.watch('name')?.trim() || createWorkout.isPending}>
							{createWorkout.isPending ? 'Creating...' : 'Create Workout'}
						</Button>
					</div>

					{createWorkout.error && (
						<div className='p-4 bg-destructive/10 border border-destructive/20 rounded-md'>
							<p className='text-destructive text-sm'>
								Failed to create workout. Please try again.
							</p>
						</div>
					)}
				</form>
			</Form>

			{/* Exercise Search Modal */}
			{showExerciseSearch && (
				<ExerciseSearch
					exercises={exercises}
					onAddExercise={addExercise}
					onClose={() => setShowExerciseSearch(false)}
				/>
			)}
		</>
	);
}
