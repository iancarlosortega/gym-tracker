'use client';

import { FiPlus, FiX } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
	ExerciseSetFormData,
	SelectedExerciseFormData,
} from '@/features/workouts/schemas/workout';

interface SelectedExercisesListProps {
	selectedExercises: SelectedExerciseFormData[];
	onRemoveExercise: (exerciseId: string) => void;
	onAddSet: (exerciseId: string) => void;
	onUpdateSet: (
		exerciseId: string,
		setIndex: number,
		field: keyof ExerciseSetFormData,
		value: string | number
	) => void;
	onRemoveSet: (exerciseId: string, setIndex: number) => void;
}

export function SelectedExercisesList({
	selectedExercises,
	onRemoveExercise,
	onAddSet,
	onUpdateSet,
	onRemoveSet,
}: SelectedExercisesListProps) {
	if (selectedExercises.length === 0) {
		return (
			<div className='text-center py-8 text-muted-foreground'>
				<p>No exercises added yet. Click "Add Exercise" to get started.</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{selectedExercises.map((exercise) => (
				<div key={exercise.id} className='border rounded-lg p-4 bg-card'>
					<div className='flex items-center justify-between mb-4'>
						<div>
							<h4 className='font-semibold text-lg'>{exercise.name}</h4>
							<div className='flex space-x-2 mt-1'>
								<Badge variant='secondary'>{exercise.primaryMuscleGroup}</Badge>
								<Badge variant='outline'>{exercise.equipment}</Badge>
							</div>
						</div>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							onClick={() => onRemoveExercise(exercise.id)}>
							<FiX className='w-4 h-4' />
						</Button>
					</div>

					<div className='space-y-2'>
						<div className='grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground'>
							<div>Set</div>
							<div>Reps</div>
							<div>Weight</div>
							<div>Actions</div>
						</div>

						{exercise.sets.map((set, setIndex) => (
							<div
								key={`${exercise.id}-${setIndex}`}
								className='grid grid-cols-4 gap-4 items-center'>
								<div className='text-sm'>{setIndex + 1}</div>
								<Input
									type='number'
									value={set.reps}
									onChange={(e) =>
										onUpdateSet(
											exercise.id,
											setIndex,
											'reps',
											parseInt(e.target.value) || 1
										)
									}
									className='h-8'
								/>
								<Input
									type='text'
									placeholder='lbs'
									value={set.weight}
									onChange={(e) =>
										onUpdateSet(exercise.id, setIndex, 'weight', e.target.value)
									}
									className='h-8'
								/>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									onClick={() => onRemoveSet(exercise.id, setIndex)}
									disabled={exercise.sets.length === 1}>
									<FiX className='w-4 h-4' />
								</Button>
							</div>
						))}

						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => onAddSet(exercise.id)}
							className='mt-2'>
							<FiPlus className='w-4 h-4 mr-2' />
							Add Set
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}
