'use client';

import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export interface Exercise {
	id: string;
	name: string;
	primaryMuscleGroup: string;
	equipment: string;
}

interface ExerciseSearchProps {
	exercises: Exercise[];
	onAddExercise: (exercise: Exercise) => void;
	onClose: () => void;
}

export function ExerciseSearch({
	exercises,
	onAddExercise,
	onClose,
}: ExerciseSearchProps) {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredExercises = exercises.filter(
		(exercise) =>
			exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			exercise.primaryMuscleGroup
				.toLowerCase()
				.includes(searchQuery.toLowerCase())
	);

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
			<Card className='w-full max-w-2xl max-h-[80vh] overflow-hidden'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Add Exercise</CardTitle>
						<Button variant='ghost' size='sm' onClick={onClose}>
							<FiX className='w-4 h-4' />
						</Button>
					</div>
					<div className='relative'>
						<FiSearch className='absolute left-3 top-3 w-4 h-4 text-muted-foreground' />
						<Input
							type='text'
							placeholder='Search exercises...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='pl-10'
						/>
					</div>
				</CardHeader>
				<CardContent className='overflow-y-auto max-h-96'>
					<div className='space-y-2'>
						{filteredExercises.map((exercise) => (
							<button
								key={exercise.id}
								type='button'
								className='p-3 border rounded-lg cursor-pointer hover:bg-accent text-left w-full'
								onClick={() => onAddExercise(exercise)}>
								<div className='font-medium'>{exercise.name}</div>
								<div className='flex space-x-2 mt-1'>
									<Badge variant='secondary' className='text-xs'>
										{exercise.primaryMuscleGroup}
									</Badge>
									<Badge variant='outline' className='text-xs'>
										{exercise.equipment}
									</Badge>
								</div>
							</button>
						))}
						{filteredExercises.length === 0 && (
							<p className='text-center text-muted-foreground py-8'>
								No exercises found
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
