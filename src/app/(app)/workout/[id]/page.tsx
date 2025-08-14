'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
	FiCheck,
	FiEdit,
	FiLoader,
	FiPlus,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import { Badge } from '@/features/shared/components/badge';
import { Button } from '@/features/shared/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/card';
import { Input } from '@/features/shared/components/input';
import { useWorkout } from '@/features/workouts/hooks/use-workouts';

interface WorkoutDetailsPageProps {
	params: { id: string };
}

export default function WorkoutDetailsPage({
	params,
}: WorkoutDetailsPageProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const { data: workout, isLoading, error } = useWorkout(params.id);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<FiLoader className='animate-spin w-8 h-8 mx-auto mb-4 text-gray-400' />
					<p className='text-gray-400'>Loading workout...</p>
				</div>
			</div>
		);
	}

	if (error || !workout) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<p className='text-red-400 mb-4'>Failed to load workout</p>
					<Button onClick={() => router.push('/dashboard')}>
						Return to Dashboard
					</Button>
				</div>
			</div>
		);
	}

	const handleAddExercise = () => {
		router.push(`/workout/${params.id}/add-exercise`);
	};

	return (
		<div className='container mx-auto py-8'>
			<div className='mb-8 flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>{workout.name}</h1>
					<p className='mt-1 text-sm text-muted-foreground'>
						Created {new Date(workout.createdAt).toLocaleDateString()}
					</p>
				</div>
				<div className='flex space-x-2'>
					<Button variant='outline' onClick={() => setIsEditing(!isEditing)}>
						<FiEdit />
						{isEditing ? 'Cancel' : 'Edit'}
					</Button>
					<Button onClick={handleAddExercise}>
						<FiPlus />
						Add Exercise
					</Button>
				</div>
			</div>

			{workout.notes && (
				<Card>
					<CardHeader>
						<CardTitle className='text-lg '>Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<p>{workout.notes}</p>
					</CardContent>
				</Card>
			)}

			<div className='space-y-6'>
				{workout.exercises?.map((workoutExercise: any) => (
					<Card key={workoutExercise.id}>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle className='text-xl'>
										{workoutExercise.exercise?.name}
									</CardTitle>
									<CardDescription>
										<Badge
											variant='secondary'
											className='mr-2 bg-blue-900 text-blue-200'>
											{workoutExercise.exercise?.primaryMuscleGroup}
										</Badge>
										<Badge
											variant='outline'
											className='border-gray-600 text-gray-300'>
											{workoutExercise.exercise?.equipment}
										</Badge>
									</CardDescription>
								</div>
								<Button
									variant='ghost'
									size='sm'
									className='text-gray-400 hover:text-red-400'>
									<FiTrash2 className='w-4 h-4' />
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								<div className='grid grid-cols-4 gap-4 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2'>
									<div>Set</div>
									<div>Reps</div>
									<div>Weight (lbs)</div>
									<div>Status</div>
								</div>

								{workoutExercise.sets?.map((set: any, setIndex: number) => (
									<div
										key={set.id}
										className='grid grid-cols-4 gap-4 items-center py-2'>
										<div className='text-sm font-medium text-gray-300'>
											{setIndex + 1}
										</div>
										<div>
											{isEditing ? (
												<Input
													type='number'
													value={set.reps}
													className='h-8 bg-gray-800 border-gray-700 text-white'
												/>
											) : (
												<span className='text-gray-300'>{set.reps}</span>
											)}
										</div>
										<div>
											{isEditing ? (
												<Input
													type='number'
													value={set.weight || ''}
													placeholder='0'
													className='h-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
												/>
											) : (
												<span className='text-gray-300'>
													{set.weight ? `${set.weight} lbs` : 'Bodyweight'}
												</span>
											)}
										</div>
										<div className='flex items-center'>
											{set.completed ? (
												<Badge
													variant='default'
													className='bg-green-900 text-green-200 border-green-800'>
													<FiCheck className='w-3 h-3 mr-1' />
													Complete
												</Badge>
											) : (
												<Badge
													variant='secondary'
													className='bg-gray-800 text-gray-300'>
													<FiX className='w-3 h-3 mr-1' />
													Pending
												</Badge>
											)}
										</div>
									</div>
								))}

								{isEditing && (
									<Button variant='outline' size='sm' className='mt-2'>
										<FiPlus className='w-4 h-4 mr-2' />
										Add Set
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{isEditing && (
				<div className='mt-8 flex justify-end space-x-4'>
					<Button variant='outline' onClick={() => setIsEditing(false)}>
						Cancel
					</Button>
					<Button onClick={() => setIsEditing(false)}>Save Changes</Button>
				</div>
			)}
		</div>
	);
}
