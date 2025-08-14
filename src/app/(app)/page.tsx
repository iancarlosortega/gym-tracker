'use client';

import Link from 'next/link';
import {
	FiActivity,
	FiCalendar,
	FiPlus,
	FiTarget,
	FiTrendingUp,
} from 'react-icons/fi';
import { useBodyMeasurements } from '@/features/body-measurements/hooks/use-body-measurements';
import { Button } from '@/features/shared/components/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/card';
import { useWorkouts } from '@/features/workouts/hooks/use-workouts';

const QUICK_ACTIONS = [
	{
		href: '/workout/new',
		icon: FiPlus,
		title: 'Start Workout',
		description: 'Begin a new training session',
	},
	{
		href: '/exercises',
		icon: FiTarget,
		title: 'Browse Exercises',
		description: 'Explore exercise library',
	},
	{
		href: '/progress',
		icon: FiTrendingUp,
		title: 'View Progress',
		description: 'Check your improvements',
	},
];

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
		<div className='container mx-auto py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold'>Dashboard</h1>
				<p className='mt-1 text-sm'>Track your fitness journey</p>
			</div>
			{/* Quick Actions */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
				{QUICK_ACTIONS.map((action) => {
					const IconComponent = action.icon;
					return (
						<Card
							key={action.href}
							className='p-0 flex justify-center items-center'>
							<Link
								href={action.href}
								className='w-full py-8 text-center transition-colors group'>
								<IconComponent className='w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform' />
								<h3 className='text-lg font-semibold'>{action.title}</h3>
								<p className='text-muted-foreground text-sm mt-1'>
									{action.description}
								</p>
							</Link>
						</Card>
					);
				})}
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				{/* Recent Workouts */}
				<Card>
					<CardHeader className='flex items-center justify-between mb-6'>
						<CardTitle className='text-xl font-semibold flex items-center'>
							<FiActivity className='w-5 h-5 mr-2 text-primary' />
							Recent Workouts
						</CardTitle>
						<Link
							href='/workouts'
							className='text-primary hover:primary/90 text-sm font-medium'>
							View All
						</Link>
					</CardHeader>

					{recentWorkouts.length > 0 ? (
						<CardContent>
							{recentWorkouts.map((workout) => (
								<div
									key={workout.id}
									className='flex items-center justify-between p-4 rounded-lg'>
									<div>
										<h3 className='font-medium'>{workout.name}</h3>
										<p className='text-sm text-gray-400'>
											{new Date(workout.createdAt).toLocaleDateString()}
											{workout.duration && ` • ${workout.duration} min`}
										</p>
									</div>
									<Button asChild>
										<Link href={`/workout/${workout.id}`}>View</Link>
									</Button>
								</div>
							))}
						</CardContent>
					) : (
						<CardContent className='text-center py-8'>
							<FiActivity className='w-12 h-12 mx-auto mb-4' />
							<h3 className='text-lg font-medium  mb-2'>No workouts yet</h3>
							<p className='text-gray-400 mb-4'>
								Start your first workout to track your progress
							</p>
							<Button asChild>
								<Link href='/workout/new'>
									<FiPlus />
									Start First Workout
								</Link>
							</Button>
						</CardContent>
					)}
				</Card>

				{/* Progress Overview */}
				<Card>
					<CardHeader className='flex items-center justify-between mb-6'>
						<CardTitle className='text-xl font-semibold flex items-center'>
							<FiTrendingUp className='w-5 h-5 mr-2 text-primary' />
							Progress Overview
						</CardTitle>
						<Link
							href='/measurements'
							className='text-primary hover:text-primary/90 text-sm font-medium'>
							Update
						</Link>
					</CardHeader>

					{latestMeasurement ? (
						<CardContent>
							<div className='grid grid-cols-2 gap-4'>
								{latestMeasurement.weight && (
									<div className='rounded-lg p-4'>
										<p className='text-sm text-gray-400'>Current Weight</p>
										<p className='text-2xl font-bold'>
											{latestMeasurement.weight} kg
										</p>
									</div>
								)}
								{latestMeasurement.bodyFat && (
									<div className='rounded-lg p-4'>
										<p className='text-sm text-gray-400'>Body Fat</p>
										<p className='text-2xl font-bold'>
											{latestMeasurement.bodyFat}%
										</p>
									</div>
								)}
							</div>
							<p className='text-sm text-gray-400'>
								Last updated:{' '}
								{new Date(latestMeasurement.recordedAt).toLocaleDateString()}
							</p>
						</CardContent>
					) : (
						<CardContent className='text-center py-8'>
							<FiTrendingUp className='w-12 h-12 mx-auto mb-4' />
							<h3 className='text-lg font-medium mb-2'>No measurements yet</h3>
							<p className='text-gray-400 mb-4'>
								Track your body measurements to monitor progress
							</p>
							<Button asChild>
								<Link href='/measurements'>
									<FiPlus className='w-4 h-4 mr-2' />
									Add Measurements
								</Link>
							</Button>
						</CardContent>
					)}
				</Card>
			</div>

			{/* Weekly Schedule Preview */}
			<Card className='mt-8'>
				<CardHeader className='text-xl font-semibold flex items-center'>
					<FiCalendar className='w-5 h-5 mr-2 text-orange-500' />
					This Week
				</CardHeader>
				<CardContent className='grid grid-cols-7 gap-2'>
					{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
						<div key={day} className='text-center'>
							<p className='text-sm font-medium text-muted-foreground mb-2'>
								{day}
							</p>
							<div className='h-16 bg-secondary rounded-lg flex items-center justify-center'>
								<span className='text-xs text-accent-foreground'>Rest</span>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
