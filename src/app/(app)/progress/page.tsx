'use client';

import { FiBarChart, FiCalendar, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { Badge } from '@/features/shared/components/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/features/shared/components/card';

export default function ProgressPage() {
	return (
		<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-950 min-h-screen'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-white'>Progress & Analytics</h1>
				<p className='mt-1 text-sm text-gray-400'>
					Track your fitness journey and monitor improvements over time
				</p>
			</div>

			{/* Stats Overview */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-white'>
							Total Workouts
						</CardTitle>
						<FiTarget className='h-4 w-4 text-gray-400' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-white'>12</div>
						<p className='text-xs text-gray-400'>+2 from last week</p>
					</CardContent>
				</Card>

				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-white'>
							Training Hours
						</CardTitle>
						<FiBarChart className='h-4 w-4 text-gray-400' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-white'>24.5</div>
						<p className='text-xs text-gray-400'>+3.2 hours from last week</p>
					</CardContent>
				</Card>

				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-white'>
							Average Duration
						</CardTitle>
						<FiCalendar className='h-4 w-4 text-gray-400' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-white'>68</div>
						<p className='text-xs text-gray-400'>minutes per workout</p>
					</CardContent>
				</Card>

				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium text-white'>
							Weekly Goal
						</CardTitle>
						<FiTrendingUp className='h-4 w-4 text-gray-400' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-white'>75%</div>
						<p className='text-xs text-gray-400'>3 of 4 workouts completed</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader>
						<CardTitle className='text-white'>Weekly Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='h-64 flex items-center justify-center text-gray-400'>
							Chart will be implemented with a charting library
						</div>
					</CardContent>
				</Card>

				<Card className='bg-gray-900 border-gray-800'>
					<CardHeader>
						<CardTitle className='text-white'>
							Muscle Group Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Badge
										variant='outline'
										className='border-gray-600 text-gray-300'>
										Chest
									</Badge>
								</div>
								<div className='flex-1 mx-4 bg-gray-700 rounded-full h-2'>
									<div
										className='bg-blue-500 h-2 rounded-full'
										style={{ width: '75%' }}></div>
								</div>
								<span className='text-sm text-gray-400'>75%</span>
							</div>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Badge
										variant='outline'
										className='border-gray-600 text-gray-300'>
										Back
									</Badge>
								</div>
								<div className='flex-1 mx-4 bg-gray-700 rounded-full h-2'>
									<div
										className='bg-green-500 h-2 rounded-full'
										style={{ width: '60%' }}></div>
								</div>
								<span className='text-sm text-gray-400'>60%</span>
							</div>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Badge
										variant='outline'
										className='border-gray-600 text-gray-300'>
										Legs
									</Badge>
								</div>
								<div className='flex-1 mx-4 bg-gray-700 rounded-full h-2'>
									<div
										className='bg-purple-500 h-2 rounded-full'
										style={{ width: '45%' }}></div>
								</div>
								<span className='text-sm text-gray-400'>45%</span>
							</div>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-2'>
									<Badge
										variant='outline'
										className='border-gray-600 text-gray-300'>
										Shoulders
									</Badge>
								</div>
								<div className='flex-1 mx-4 bg-gray-700 rounded-full h-2'>
									<div
										className='bg-orange-500 h-2 rounded-full'
										style={{ width: '30%' }}></div>
								</div>
								<span className='text-sm text-gray-400'>30%</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent PRs */}
			<Card className='bg-gray-900 border-gray-800'>
				<CardHeader>
					<CardTitle className='text-white'>Recent Personal Records</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='flex items-center justify-between p-4 bg-green-900 border border-green-700 rounded-lg'>
							<div>
								<h4 className='font-semibold text-white'>Bench Press</h4>
								<p className='text-sm text-gray-400'>3 days ago</p>
							</div>
							<div className='text-right'>
								<div className='text-lg font-bold text-green-300'>225 lbs</div>
								<Badge
									variant='outline'
									className='text-green-300 border-green-600'>
									+10 lbs PR
								</Badge>
							</div>
						</div>
						<div className='flex items-center justify-between p-4 bg-blue-900 border border-blue-700 rounded-lg'>
							<div>
								<h4 className='font-semibold text-white'>Deadlift</h4>
								<p className='text-sm text-gray-400'>1 week ago</p>
							</div>
							<div className='text-right'>
								<div className='text-lg font-bold text-blue-300'>315 lbs</div>
								<Badge
									variant='outline'
									className='text-blue-300 border-blue-600'>
									+15 lbs PR
								</Badge>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
