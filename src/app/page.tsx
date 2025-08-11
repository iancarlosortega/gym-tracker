'use client';

import Link from 'next/link';
import {
	FiActivity,
	FiCalendar,
	FiPlus,
	FiTarget,
	FiTrendingUp,
} from 'react-icons/fi';
import { useBodyMeasurements } from '@/hooks/use-body-measurements';
import { useWorkouts } from '@/hooks/use-workouts';

export default function HomePage() {
	const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts();
	const { data: measurements = [], isLoading: measurementsLoading } =
		useBodyMeasurements();

	const recentWorkouts = workouts.slice(0, 5);
	const latestMeasurement = measurements[0] || null;
	const isLoading = workoutsLoading || measurementsLoading;

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64 bg-gray-950'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
					<p className='mt-4 text-gray-400'>Loading your dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-950 min-h-screen'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-white'>Dashboard</h1>
				<p className='mt-1 text-sm text-gray-400'>Track your fitness journey</p>
			</div>
			{/* Quick Actions */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
				<Link
					href='/workout/new'
					className='bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-center transition-colors group'>
					<FiPlus className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
					<h3 className='text-lg font-semibold'>Start Workout</h3>
					<p className='text-blue-100 text-sm mt-1'>
						Begin a new training session
					</p>
				</Link>

				<Link
					href='/exercises'
					className='bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-center transition-colors group'>
					<FiTarget className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
					<h3 className='text-lg font-semibold'>Browse Exercises</h3>
					<p className='text-green-100 text-sm mt-1'>
						Explore exercise library
					</p>
				</Link>

				<Link
					href='/progress'
					className='bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-center transition-colors group'>
					<FiTrendingUp className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
					<h3 className='text-lg font-semibold'>View Progress</h3>
					<p className='text-purple-100 text-sm mt-1'>
						Check your improvements
					</p>
				</Link>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* Recent Workouts */}
				<div className='bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6'>
					<div className='flex items-center justify-between mb-6'>
						<h2 className='text-xl font-semibold text-white flex items-center'>
							<FiActivity className='w-5 h-5 mr-2 text-blue-500' />
							Recent Workouts
						</h2>
						<Link
							href='/workouts'
							className='text-blue-400 hover:text-blue-300 text-sm font-medium'>
							View All
						</Link>
					</div>

					{recentWorkouts.length > 0 ? (
						<div className='space-y-4'>
							{recentWorkouts.map((workout) => (
								<div
									key={workout.id}
									className='flex items-center justify-between p-4 bg-gray-800 rounded-lg'>
									<div>
										<h3 className='font-medium text-white'>{workout.name}</h3>
										<p className='text-sm text-gray-400'>
											{new Date(workout.createdAt).toLocaleDateString()}
											{workout.duration && ` • ${workout.duration} min`}
										</p>
									</div>
									<Link
										href={`/workout/${workout.id}`}
										className='text-blue-400 hover:text-blue-300 text-sm font-medium'>
										View
									</Link>
								</div>
							))}
						</div>
					) : (
						<div className='text-center py-8'>
							<FiActivity className='w-12 h-12 mx-auto text-gray-500 mb-4' />
							<h3 className='text-lg font-medium text-white mb-2'>
								No workouts yet
							</h3>
							<p className='text-gray-400 mb-4'>
								Start your first workout to track your progress
							</p>
							<Link
								href='/workout/new'
								className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
								<FiPlus className='w-4 h-4 mr-2' />
								Start First Workout
							</Link>
						</div>
					)}
				</div>

				{/* Progress Overview */}
				<div className='bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6'>
					<div className='flex items-center justify-between mb-6'>
						<h2 className='text-xl font-semibold text-white flex items-center'>
							<FiTrendingUp className='w-5 h-5 mr-2 text-green-500' />
							Progress Overview
						</h2>
						<Link
							href='/measurements'
							className='text-blue-400 hover:text-blue-300 text-sm font-medium'>
							Update
						</Link>
					</div>

					{latestMeasurement ? (
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								{latestMeasurement.weight && (
									<div className='bg-gray-800 rounded-lg p-4'>
										<p className='text-sm text-gray-400'>Current Weight</p>
										<p className='text-2xl font-bold text-white'>
											{latestMeasurement.weight} kg
										</p>
									</div>
								)}
								{latestMeasurement.bodyFat && (
									<div className='bg-gray-800 rounded-lg p-4'>
										<p className='text-sm text-gray-400'>Body Fat</p>
										<p className='text-2xl font-bold text-white'>
											{latestMeasurement.bodyFat}%
										</p>
									</div>
								)}
							</div>
							<p className='text-sm text-gray-400'>
								Last updated:{' '}
								{new Date(latestMeasurement.recordedAt).toLocaleDateString()}
							</p>
						</div>
					) : (
						<div className='text-center py-8'>
							<FiTrendingUp className='w-12 h-12 mx-auto text-gray-500 mb-4' />
							<h3 className='text-lg font-medium text-white mb-2'>
								No measurements yet
							</h3>
							<p className='text-gray-400 mb-4'>
								Track your body measurements to monitor progress
							</p>
							<Link
								href='/measurements'
								className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'>
								<FiPlus className='w-4 h-4 mr-2' />
								Add Measurements
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Weekly Schedule Preview */}
			<div className='mt-8 bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6'>
				<h2 className='text-xl font-semibold text-white flex items-center mb-6'>
					<FiCalendar className='w-5 h-5 mr-2 text-orange-500' />
					This Week
				</h2>
				<div className='grid grid-cols-7 gap-2'>
					{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
						<div key={day} className='text-center'>
							<p className='text-sm font-medium text-white mb-2'>{day}</p>
							<div className='h-16 bg-gray-800 rounded-lg flex items-center justify-center'>
								<span className='text-xs text-gray-400'>Rest</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
