'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiLoader, FiPlus, FiSave, FiSearch, FiX } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExercises } from '@/features/excercises/hooks/use-exercises';
import { useCreateWorkout } from '@/features/workouts/hooks/use-workouts';

interface SelectedExercise {
	id: string;
	name: string;
	primaryMuscleGroup: string;
	equipment: string;
	sets: Array<{
		reps: number;
		weight: string;
		notes: string;
	}>;
}

export default function NewWorkoutPage() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [notes, setNotes] = useState('');
	const [selectedExercises, setSelectedExercises] = useState<
		SelectedExercise[]
	>([]);
	const [showExerciseSearch, setShowExerciseSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const createWorkout = useCreateWorkout();
	const { data: exercises = [] } = useExercises();

	const filteredExercises = exercises.filter(
		(exercise) =>
			exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			exercise.primaryMuscleGroup
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
	);

	const addExercise = (exercise: (typeof exercises)[0]) => {
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
		setSearchQuery('');
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
		field: string,
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			return;
		}

		try {
			const workout = await createWorkout.mutateAsync({
				name: name.trim(),
				notes: notes.trim() || undefined,
			});

			// For now, just redirect - later we'll add exercises to the workout
			router.push(`/workout/${workout.id}`);
		} catch (error) {
			console.error('Failed to create workout:', error);
		}
	};

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-foreground'>New Workout</h1>
				<p className='mt-1 text-sm text-muted-foreground'>
					Create a new training session
				</p>
			</div>

			<form onSubmit={handleSubmit} className='space-y-8'>
				{/* Basic Information */}
				<Card className='bg-card border-border'>
					<CardHeader>
						<CardTitle className='text-card-foreground'>
							Workout Details
						</CardTitle>
						<CardDescription className='text-muted-foreground'>
							Enter the basic information for your workout session
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='name' className='text-foreground'>
								Workout Name *
							</Label>
							<Input
								id='name'
								type='text'
								placeholder='e.g., Upper Body Strength, Morning Cardio'
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								className='bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='notes' className='text-foreground'>
								Notes (Optional)
							</Label>
							<Textarea
								id='notes'
								placeholder='Any additional notes about this workout...'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
								className='bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
					</CardContent>
				</Card>

				{/* Exercise Selection */}
				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle className='text-white'>Exercises</CardTitle>
								<CardDescription className='text-gray-400'>
									Add exercises to your workout plan
								</CardDescription>
							</div>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowExerciseSearch(true)}
								className='border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'>
								<FiPlus className='w-4 h-4 mr-2' />
								Add Exercise
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{selectedExercises.length === 0 ? (
							<div className='text-center py-8 text-gray-400'>
								<p>
									No exercises added yet. Click "Add Exercise" to get started.
								</p>
							</div>
						) : (
							<div className='space-y-6'>
								{selectedExercises.map((exercise) => (
									<div
										key={exercise.id}
										className='border border-gray-700 rounded-lg p-4 bg-gray-800'>
										<div className='flex items-center justify-between mb-4'>
											<div>
												<h4 className='font-semibold text-lg text-white'>
													{exercise.name}
												</h4>
												<div className='flex space-x-2 mt-1'>
													<Badge
														variant='secondary'
														className='bg-gray-700 text-gray-300'>
														{exercise.primaryMuscleGroup}
													</Badge>
													<Badge
														variant='outline'
														className='border-gray-600 text-gray-300'>
														{exercise.equipment}
													</Badge>
												</div>
											</div>
											<Button
												type='button'
												variant='ghost'
												size='sm'
												onClick={() => removeExercise(exercise.id)}
												className='text-gray-400 hover:text-red-400 hover:bg-gray-700'>
												<FiX className='w-4 h-4' />
											</Button>
										</div>

										<div className='space-y-2'>
											<div className='grid grid-cols-4 gap-4 text-sm font-medium text-gray-400'>
												<div>Set</div>
												<div>Reps</div>
												<div>Weight</div>
												<div>Actions</div>
											</div>

											{exercise.sets.map((set, setIndex) => (
												<div
													key={`${exercise.id}-${setIndex}`}
													className='grid grid-cols-4 gap-4 items-center'>
													<div className='text-sm text-white'>
														{setIndex + 1}
													</div>
													<Input
														type='number'
														value={set.reps}
														onChange={(e) =>
															updateSet(
																exercise.id,
																setIndex,
																'reps',
																parseInt(e.target.value) || 0
															)
														}
														className='h-8 bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
													/>
													<Input
														type='text'
														placeholder='lbs'
														value={set.weight}
														onChange={(e) =>
															updateSet(
																exercise.id,
																setIndex,
																'weight',
																e.target.value
															)
														}
														className='h-8 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
													/>
													<Button
														type='button'
														variant='ghost'
														size='sm'
														onClick={() => removeSet(exercise.id, setIndex)}
														disabled={exercise.sets.length === 1}
														className='text-gray-400 hover:text-red-400 hover:bg-gray-700'>
														<FiX className='w-4 h-4' />
													</Button>
												</div>
											))}

											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() => addSet(exercise.id)}
												className='mt-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'>
												<FiPlus className='w-4 h-4 mr-2' />
												Add Set
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Submit */}
				<div className='flex justify-end space-x-4'>
					<Button
						type='button'
						variant='outline'
						onClick={() => router.push('/dashboard')}
						disabled={createWorkout.isPending}>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={!name.trim() || createWorkout.isPending}>
						{createWorkout.isPending ? (
							<>
								<FiLoader className='w-4 h-4 mr-2 animate-spin' />
								Creating...
							</>
						) : (
							<>
								<FiSave className='w-4 h-4 mr-2' />
								Create Workout
							</>
						)}
					</Button>
				</div>

				{createWorkout.error && (
					<div className='p-4 bg-red-50 border border-red-200 rounded-md'>
						<p className='text-red-800 text-sm'>
							Failed to create workout. Please try again.
						</p>
					</div>
				)}
			</form>

			{/* Exercise Search Modal */}
			{showExerciseSearch && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
					<Card className='w-full max-w-2xl max-h-[80vh] overflow-hidden bg-gray-900 border-gray-800'>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='text-white'>Add Exercise</CardTitle>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setShowExerciseSearch(false)}
									className='text-gray-400 hover:text-white hover:bg-gray-800'>
									<FiX className='w-4 h-4' />
								</Button>
							</div>
							<div className='relative'>
								<FiSearch className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
								<Input
									type='text'
									placeholder='Search exercises...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
								/>
							</div>
						</CardHeader>
						<CardContent className='overflow-y-auto max-h-96'>
							<div className='space-y-2'>
								{filteredExercises.map((exercise) => (
									<button
										key={exercise.id}
										type='button'
										className='p-3 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 text-left w-full bg-gray-900'
										onClick={() => addExercise(exercise)}>
										<div className='font-medium text-white'>
											{exercise.name}
										</div>
										<div className='flex space-x-2 mt-1'>
											<Badge
												variant='secondary'
												className='text-xs bg-blue-900 text-blue-200'>
												{exercise.primaryMuscleGroup}
											</Badge>
											<Badge
												variant='outline'
												className='text-xs border-gray-600 text-gray-300'>
												{exercise.equipment}
											</Badge>
										</div>
									</button>
								))}
								{filteredExercises.length === 0 && (
									<p className='text-center text-gray-400 py-8'>
										No exercises found
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
