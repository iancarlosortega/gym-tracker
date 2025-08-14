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
		<div className='min-h-screen bg-gray-950'>
			<header className='bg-gray-900 shadow-sm border-b border-gray-800'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between py-6'>
						<div>
							<h1 className='text-3xl font-bold text-white'>
								Exercise Library
							</h1>
							<p className='mt-1 text-sm text-gray-400'>
								Browse and search for exercises
							</p>
						</div>
						<AddExerciseDialog />
					</div>
				</div>
			</header>

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Filters */}
				<Card className='mb-8 bg-gray-900 border-gray-800'>
					<CardHeader>
						<CardTitle className='flex items-center text-white'>
							<FiFilter className='w-5 h-5 mr-2' />
							Filters
						</CardTitle>
						<CardDescription className='text-gray-400'>
							Search and filter exercises by type, muscle group, and equipment
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
							<div className='space-y-2'>
								<Label htmlFor='search' className='text-gray-300'>
									Search
								</Label>
								<div className='relative'>
									<FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4' />
									<Input
										id='search'
										type='text'
										placeholder='Search exercises...'
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className='pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-blue-500 focus:border-blue-500'
									/>
								</div>
							</div>

							<div className='space-y-2'>
								<Label className='text-gray-300'>Type</Label>
								<Select value={type} onValueChange={setType}>
									<SelectTrigger className='bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500'>
										<SelectValue placeholder='All Types' />
									</SelectTrigger>
									<SelectContent className='bg-gray-800 border-gray-700'>
										<SelectItem
											value='all'
											className='text-white focus:bg-gray-700'>
											All Types
										</SelectItem>
										<SelectItem
											value='strength'
											className='text-white focus:bg-gray-700'>
											Strength
										</SelectItem>
										<SelectItem
											value='cardio'
											className='text-white focus:bg-gray-700'>
											Cardio
										</SelectItem>
										<SelectItem
											value='flexibility'
											className='text-white focus:bg-gray-700'>
											Flexibility
										</SelectItem>
										<SelectItem
											value='balance'
											className='text-white focus:bg-gray-700'>
											Balance
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label className='text-gray-300'>Muscle Group</Label>
								<Select value={muscleGroup} onValueChange={setMuscleGroup}>
									<SelectTrigger className='bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500'>
										<SelectValue placeholder='All Muscle Groups' />
									</SelectTrigger>
									<SelectContent className='bg-gray-800 border-gray-700'>
										<SelectItem
											value='all'
											className='text-white focus:bg-gray-700'>
											All Muscle Groups
										</SelectItem>
										<SelectItem
											value='chest'
											className='text-white focus:bg-gray-700'>
											Chest
										</SelectItem>
										<SelectItem
											value='back'
											className='text-white focus:bg-gray-700'>
											Back
										</SelectItem>
										<SelectItem
											value='shoulders'
											className='text-white focus:bg-gray-700'>
											Shoulders
										</SelectItem>
										<SelectItem
											value='biceps'
											className='text-white focus:bg-gray-700'>
											Biceps
										</SelectItem>
										<SelectItem
											value='triceps'
											className='text-white focus:bg-gray-700'>
											Triceps
										</SelectItem>
										<SelectItem
											value='forearms'
											className='text-white focus:bg-gray-700'>
											Forearms
										</SelectItem>
										<SelectItem
											value='core'
											className='text-white focus:bg-gray-700'>
											Core
										</SelectItem>
										<SelectItem
											value='glutes'
											className='text-white focus:bg-gray-700'>
											Glutes
										</SelectItem>
										<SelectItem
											value='quadriceps'
											className='text-white focus:bg-gray-700'>
											Quadriceps
										</SelectItem>
										<SelectItem
											value='hamstrings'
											className='text-white focus:bg-gray-700'>
											Hamstrings
										</SelectItem>
										<SelectItem
											value='calves'
											className='text-white focus:bg-gray-700'>
											Calves
										</SelectItem>
										<SelectItem
											value='full_body'
											className='text-white focus:bg-gray-700'>
											Full Body
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<Label className='text-gray-300'>Equipment</Label>
								<Select value={equipment} onValueChange={setEquipment}>
									<SelectTrigger className='bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500'>
										<SelectValue placeholder='All Equipment' />
									</SelectTrigger>
									<SelectContent className='bg-gray-800 border-gray-700'>
										<SelectItem
											value='all'
											className='text-white focus:bg-gray-700'>
											All Equipment
										</SelectItem>
										<SelectItem
											value='barbell'
											className='text-white focus:bg-gray-700'>
											Barbell
										</SelectItem>
										<SelectItem
											value='dumbbell'
											className='text-white focus:bg-gray-700'>
											Dumbbell
										</SelectItem>
										<SelectItem
											value='machine'
											className='text-white focus:bg-gray-700'>
											Machine
										</SelectItem>
										<SelectItem
											value='cable'
											className='text-white focus:bg-gray-700'>
											Cable
										</SelectItem>
										<SelectItem
											value='bodyweight'
											className='text-white focus:bg-gray-700'>
											Bodyweight
										</SelectItem>
										<SelectItem
											value='resistance_band'
											className='text-white focus:bg-gray-700'>
											Resistance Band
										</SelectItem>
										<SelectItem
											value='kettlebell'
											className='text-white focus:bg-gray-700'>
											Kettlebell
										</SelectItem>
										<SelectItem
											value='medicine_ball'
											className='text-white focus:bg-gray-700'>
											Medicine Ball
										</SelectItem>
										<SelectItem
											value='treadmill'
											className='text-white focus:bg-gray-700'>
											Treadmill
										</SelectItem>
										<SelectItem
											value='bike'
											className='text-white focus:bg-gray-700'>
											Bike
										</SelectItem>
										<SelectItem
											value='rowing_machine'
											className='text-white focus:bg-gray-700'>
											Rowing Machine
										</SelectItem>
										<SelectItem
											value='other'
											className='text-white focus:bg-gray-700'>
											Other
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='mt-4 flex gap-2'>
							<Button
								variant='outline'
								onClick={clearFilters}
								size='sm'
								className='border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'>
								Clear All Filters
							</Button>
							<div className='text-sm text-gray-400 self-center'>
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
							<Card
								key={exercise.id}
								className='hover:shadow-lg transition-shadow bg-gray-900 border-gray-800 hover:border-gray-700'>
								<CardHeader>
									<div className='flex items-start justify-between'>
										<CardTitle className='text-lg text-white'>
											{exercise.name}
										</CardTitle>
										<Badge
											variant='secondary'
											className='bg-gray-800 text-gray-300 hover:bg-gray-700'>
											{exercise.type}
										</Badge>
									</div>
									{exercise.description && (
										<CardDescription className='text-gray-400'>
											{exercise.description}
										</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										<div>
											<div className='text-sm font-medium mb-2 text-gray-300'>
												Target Muscles
											</div>
											<div className='flex flex-wrap gap-1'>
												<Badge className='bg-blue-600 text-white hover:bg-blue-700'>
													{exercise.primaryMuscleGroup.replace('_', ' ')}
												</Badge>
												{exercise.secondaryMuscleGroups &&
													exercise.secondaryMuscleGroups.length > 0 &&
													exercise.secondaryMuscleGroups.map((muscle) => (
														<Badge
															key={muscle}
															variant='outline'
															className='text-xs border-gray-600 text-gray-300 hover:bg-gray-800'>
															{muscle.replace('_', ' ')}
														</Badge>
													))}
											</div>
										</div>

										<div>
											<div className='text-sm font-medium mb-2 text-gray-300'>
												Equipment
											</div>
											<Badge
												variant='outline'
												className='border-gray-600 text-gray-300 hover:bg-gray-800'>
												{exercise.equipment.replace('_', ' ')}
											</Badge>
										</div>

										{exercise.instructions && (
											<div>
												<div className='text-sm font-medium mb-1 text-gray-300'>
													Instructions
												</div>
												<p className='text-sm text-gray-400'>
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
