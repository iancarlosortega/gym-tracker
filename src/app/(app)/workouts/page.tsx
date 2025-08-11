'use client';

import Link from 'next/link';
import { FiActivity, FiCalendar, FiClock, FiPlus } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkouts } from '@/features/workouts/hooks/use-workouts';

export default function WorkoutsPage() {
	const { data: workouts = [], isLoading } = useWorkouts();

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64 bg-gray-950 min-h-screen'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
					<p className='mt-4 text-gray-400'>Loading workouts...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-950 min-h-screen'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold text-white'>My Workouts</h1>
					<p className='mt-1 text-sm text-gray-400'>
						Track and manage your training sessions
					</p>
				</div>
				<Link href='/workout/new'>
					<Button className='bg-blue-600 hover:bg-blue-700 text-white'>
						<FiPlus className='w-4 h-4 mr-2' />
						New Workout
					</Button>
				</Link>
			</div>

			{workouts.length === 0 ? (
				<div className='text-center py-12'>
					<FiActivity className='w-16 h-16 mx-auto text-gray-500 mb-4' />
					<h3 className='text-xl font-semibold text-white mb-2'>
						No workouts yet
					</h3>
					<p className='text-gray-400 mb-6'>
						Start your fitness journey by creating your first workout
					</p>
					<Link href='/workout/new'>
						<Button
							size='lg'
							className='bg-blue-600 hover:bg-blue-700 text-white'>
							<FiPlus className='w-5 h-5 mr-2' />
							Create First Workout
						</Button>
					</Link>
				</div>
			) : (
				<div className='grid gap-6'>
					{workouts.map((workout) => (
						<Card
							key={workout.id}
							className='hover:shadow-lg transition-shadow bg-gray-900 border-gray-800 hover:border-gray-700'>
							<CardHeader>
								<div className='flex items-start justify-between'>
									<div>
										<CardTitle className='text-xl mb-2 text-white'>
											{workout.name}
										</CardTitle>
										<div className='flex items-center space-x-4 text-sm text-gray-400'>
											<div className='flex items-center'>
												<FiCalendar className='w-4 h-4 mr-1' />
												{new Date(workout.createdAt).toLocaleDateString()}
											</div>
											{workout.duration && (
												<div className='flex items-center'>
													<FiClock className='w-4 h-4 mr-1' />
													{workout.duration} min
												</div>
											)}
										</div>
									</div>
									<Badge
										variant='outline'
										className='bg-green-900 border-green-700 text-green-300'>
										Completed
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								{workout.notes && (
									<p className='text-gray-300 mb-4'>{workout.notes}</p>
								)}
								<div className='flex items-center justify-between'>
									<div className='text-sm text-gray-400'>
										{/* We'll add exercise count when we have the data */}0
										exercises
									</div>
									<div className='flex space-x-2'>
										<Link href={`/workout/${workout.id}`}>
											<Button
												variant='outline'
												size='sm'
												className='border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'>
												View Details
											</Button>
										</Link>
										<Button
											variant='outline'
											size='sm'
											className='border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'>
											Duplicate
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
