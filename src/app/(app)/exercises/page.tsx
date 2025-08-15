'use client';

import { useState } from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { AddExerciseDialog } from '@/features/excercises/components/add-exercise-dialog';
import { useExercises } from '@/features/excercises/hooks/use-exercises';
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
import { Label } from '@/features/shared/components/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/features/shared/components/select';

const EXERCISE_TYPES = [
	{ value: 'all', label: 'All Types' },
	{ value: 'strength', label: 'Strength' },
	{ value: 'cardio', label: 'Cardio' },
	{ value: 'flexibility', label: 'Flexibility' },
	{ value: 'balance', label: 'Balance' },
];

const MUSCLE_GROUPS = [
	{ value: 'all', label: 'All Muscle Groups' },
	{ value: 'chest', label: 'Chest' },
	{ value: 'back', label: 'Back' },
	{ value: 'shoulders', label: 'Shoulders' },
	{ value: 'biceps', label: 'Biceps' },
	{ value: 'triceps', label: 'Triceps' },
	{ value: 'forearms', label: 'Forearms' },
	{ value: 'core', label: 'Core' },
	{ value: 'glutes', label: 'Glutes' },
	{ value: 'quadriceps', label: 'Quadriceps' },
	{ value: 'hamstrings', label: 'Hamstrings' },
	{ value: 'calves', label: 'Calves' },
	{ value: 'full_body', label: 'Full Body' },
];

const EQUIPMENT_OPTIONS = [
	{ value: 'all', label: 'All Equipment' },
	{ value: 'barbell', label: 'Barbell' },
	{ value: 'dumbbell', label: 'Dumbbell' },
	{ value: 'machine', label: 'Machine' },
	{ value: 'cable', label: 'Cable' },
	{ value: 'bodyweight', label: 'Bodyweight' },
	{ value: 'resistance_band', label: 'Resistance Band' },
	{ value: 'kettlebell', label: 'Kettlebell' },
	{ value: 'medicine_ball', label: 'Medicine Ball' },
	{ value: 'treadmill', label: 'Treadmill' },
	{ value: 'bike', label: 'Bike' },
	{ value: 'rowing_machine', label: 'Rowing Machine' },
	{ value: 'other', label: 'Other' },
];

export default function ExercisesPage() {
	const [search, setSearch] = useState('');
	const [type, setType] = useState('all');
	const [muscleGroup, setMuscleGroup] = useState('all');
	const [equipment, setEquipment] = useState('all');

	const {
		data: exercises = [],
		isLoading,
		error,
	} = useExercises({
		search: search || undefined,
		type: type === 'all' ? undefined : type,
		muscleGroup: muscleGroup === 'all' ? undefined : muscleGroup,
	});

	const filteredExercises = exercises?.filter((exercise) => {
		const matchesEquipment =
			equipment === 'all' || exercise.equipment === equipment;
		return matchesEquipment;
	});

	const clearFilters = () => {
		setSearch('');
		setType('all');
		setMuscleGroup('all');
		setEquipment('all');
	};

	return (
		<div>
			<header className='bg-gradient-to-br from-primary to-primary/80 text-muted shadow-sm border-b'>
				<div className='container mx-auto'>
					<div className='flex items-center justify-between py-6'>
						<div>
							<h1 className='text-3xl font-bold'>Exercise Library</h1>
							<p className='mt-1 text-sm'>Browse and search for exercises</p>
						</div>
						<AddExerciseDialog />
					</div>
				</div>
			</header>

			<main className='container mx-auto py-8 space-y-8'>
				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center'>
							<FiFilter className='w-5 h-5 mr-2 text-primary' />
							Filters
						</CardTitle>
						<CardDescription className='text-muted-foreground'>
							Search and filter exercises by type, muscle group, and equipment
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
							<div className='space-y-2'>
								<Label htmlFor='search'>Search</Label>
								<div className='relative'>
									<FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-input w-4 h-4' />
									<Input
										id='search'
										type='text'
										placeholder='Search exercises...'
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className='pl-10'
									/>
								</div>
							</div>

							<div className='space-y-2 '>
								<Label>Type</Label>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger>
										<SelectValue placeholder='All Types' />
									</SelectTrigger>
									<SelectContent>
										{EXERCISE_TYPES.map((exerciseType) => (
											<SelectItem
												key={exerciseType.value}
												value={exerciseType.value}>
												{exerciseType.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label>Muscle Group</Label>
								<Select value={muscleGroup} onValueChange={setMuscleGroup}>
									<SelectTrigger>
										<SelectValue placeholder='All Muscle Groups' />
									</SelectTrigger>
									<SelectContent>
										{MUSCLE_GROUPS.map((muscle) => (
											<SelectItem key={muscle.value} value={muscle.value}>
												{muscle.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label>Equipment</Label>
								<Select value={equipment} onValueChange={setEquipment}>
									<SelectTrigger>
										<SelectValue placeholder='All Equipment' />
									</SelectTrigger>
									<SelectContent>
										{EQUIPMENT_OPTIONS.map((equipmentItem) => (
											<SelectItem
												key={equipmentItem.value}
												value={equipmentItem.value}>
												{equipmentItem.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='mt-4 flex gap-2'>
							<Button variant='secondary' onClick={clearFilters} size='sm'>
								Clear All Filters
							</Button>
							<div className='text-sm text-muted-foreground self-center'>
								{filteredExercises?.length || 0} exercises found
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Exercise List */}
				{isLoading ? (
					<div className='text-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
						<p className='mt-4 text-gray-400'>Loading exercises...</p>
					</div>
				) : error ? (
					<div className='text-center py-8'>
						<p className='text-red-400'>Failed to load exercises</p>
					</div>
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{filteredExercises.map((exercise) => (
							<Card key={exercise.id}>
								<CardHeader>
									<div className='flex items-start justify-between'>
										<CardTitle className='text-xl'>{exercise.name}</CardTitle>
										<Badge variant='secondary'>{exercise.type}</Badge>
									</div>
									{exercise.description && (
										<CardDescription className='text-muted-foreground'>
											{exercise.description}
										</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										<div>
											<div className='text-sm font-semibold mb-2'>
												Target Muscles
											</div>
											<div className='flex flex-wrap gap-1'>
												<Badge>
													{exercise.primaryMuscleGroup.replace('_', ' ')}
												</Badge>
												{exercise.secondaryMuscleGroups &&
													exercise.secondaryMuscleGroups.length > 0 &&
													exercise.secondaryMuscleGroups.map((muscle) => (
														<Badge key={muscle} variant='outline'>
															{muscle.replace('_', ' ')}
														</Badge>
													))}
											</div>
										</div>

										<div>
											<div className='text-sm font-semibold mb-2'>
												Equipment
											</div>
											<Badge variant='outline'>
												{exercise.equipment.replace('_', ' ')}
											</Badge>
										</div>

										{exercise.instructions && (
											<div>
												<div className='text-sm font-semibold mb-1'>
													Instructions
												</div>
												<p className='text-sm text-muted-foreground'>
													{exercise.instructions.length > 150
														? `${exercise.instructions.substring(0, 150)}...`
														: exercise.instructions}
												</p>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
						{filteredExercises.length === 0 && (
							<div className='col-span-full text-center py-8'>
								<p className='text-gray-400'>
									No exercises found matching your criteria
								</p>
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
