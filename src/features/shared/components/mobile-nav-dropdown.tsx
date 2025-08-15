'use client';

import { Activity, Dumbbell, Home, Menu, Settings, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { Button } from '@/features/shared/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/features/shared/components/dropdown-menu';
import { cn } from '@/features/shared/lib/utils';

const links = [
	{ name: 'Home', href: '/', icon: Home },
	{ name: 'Workouts', href: '/workouts', icon: Activity },
	{ name: 'Exercises', href: '/exercises', icon: Dumbbell },
	{ name: 'Measurements', href: '/measurements', icon: Target },
];

export function MobileNavDropdown() {
	const pathname = usePathname();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon'>
					<Menu className='h-5 w-5' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-56'>
				{links.map((item) => {
					const Icon = item.icon;
					return (
						<DropdownMenuItem key={item.name} asChild>
							<Link
								href={item.href}
								className={cn(
									'flex items-center',
									pathname === item.href && 'bg-accent text-accent-foreground'
								)}>
								<Icon className='h-4 w-4 mr-2' />
								{item.name}
							</Link>
						</DropdownMenuItem>
					);
				})}
				<DropdownMenuItem asChild>
					<Link href='/profile' className='flex items-center'>
						<Settings className='h-4 w-4 mr-2' />
						Edit Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<LogoutButton />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
