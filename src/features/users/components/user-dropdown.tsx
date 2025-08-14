'use client';

import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { Button } from '@/features/shared/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/features/shared/components/dropdown-menu';

export function UserDropdown() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon'>
					<User className='h-4 w-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-56'>
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
