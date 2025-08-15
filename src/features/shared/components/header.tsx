'use client';

import { Activity, Dumbbell, Home, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/features/shared/lib/utils';
import { UserDropdown } from '@/features/users/components/user-dropdown';

const links = [
	{ name: 'Home', href: '/', icon: Home },
	{ name: 'Workouts', href: '/workouts', icon: Activity },
	{ name: 'Exercises', href: '/exercises', icon: Dumbbell },
	{ name: 'Measurements', href: '/measurements', icon: Target },
];

export function Header() {
	const pathname = usePathname();

	return (
		<header className='shadow border-b sticky top-0 z-40 bg-background'>
			<div className='container mx-auto'>
				<div className='flex justify-between items-center py-4'>
					<div className='flex items-center'>
						<Link href='/' className='flex items-center space-x-2'>
							<Target className='h-8 w-8 text-primary' />
							<span className='text-xl font-bold'>GymTracker</span>
						</Link>
					</div>

					<div className='hidden md:block'>
						<nav className='ml-10 flex items-baseline space-x-4'>
							{links.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											pathname === item.href
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary',
											'px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors'
										)}>
										<Icon className='h-4 w-4' />
										<span>{item.name}</span>
									</Link>
								);
							})}

							{/* User Dropdown */}
							<UserDropdown />
						</nav>
					</div>

					{/* Mobile menu */}
					<div className='md:hidden'>
						<nav className='flex space-x-2 items-center'>
							{links.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											pathname === item.href
												? 'bg-primary text-primary-foreground'
												: 'text-muted-foreground hover:text-secondary-foreground hover:bg-secondary',
											'p-2 rounded-md transition-colors'
										)}
										title={item.name}>
										<Icon className='h-5 w-5' />
									</Link>
								);
							})}
							<UserDropdown />
						</nav>
					</div>
				</div>
			</div>
		</header>
	);
}
