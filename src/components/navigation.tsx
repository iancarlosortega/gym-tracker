'use client';

import { Activity, Dumbbell, Home, Plus, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
	{ name: 'Dashboard', href: '/dashboard', icon: Home },
	{ name: 'Workouts', href: '/workouts', icon: Activity },
	{ name: 'Exercises', href: '/exercises', icon: Dumbbell },
	{ name: 'New Workout', href: '/workout/new', icon: Plus },
	{ name: 'Measurements', href: '/measurements', icon: Target },
];

export function Navigation() {
	const pathname = usePathname();

	return (
		<nav className='bg-gray-900 shadow border-b border-gray-800 sticky top-0 z-40'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center py-4'>
					<div className='flex items-center'>
						<Link href='/dashboard' className='flex items-center space-x-2'>
							<Target className='h-8 w-8 text-blue-500' />
							<span className='text-xl font-bold text-white'>GymTracker</span>
						</Link>
					</div>

					<div className='hidden md:block'>
						<div className='ml-10 flex items-baseline space-x-4'>
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											pathname === item.href
												? 'bg-blue-600 text-white'
												: 'text-gray-300 hover:text-white hover:bg-gray-800',
											'px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors'
										)}>
										<Icon className='h-4 w-4' />
										<span>{item.name}</span>
									</Link>
								);
							})}
						</div>
					</div>

					{/* Mobile menu */}
					<div className='md:hidden'>
						<div className='flex space-x-2'>
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											pathname === item.href
												? 'bg-blue-600 text-white'
												: 'text-gray-300 hover:text-white hover:bg-gray-800',
											'p-2 rounded-md transition-colors'
										)}
										title={item.name}>
										<Icon className='h-5 w-5' />
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
