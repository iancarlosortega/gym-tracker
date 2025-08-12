'use client';

import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from '@/features/auth/components/logout-button';

interface UserDropdownProps {
	isMobile?: boolean;
}

export function UserDropdown({ isMobile = false }: UserDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{isMobile ? (
					<Button
						variant='ghost'
						size='icon'
						className='text-muted-foreground hover:text-foreground hover:bg-accent p-2'>
						<User className='h-5 w-5' />
					</Button>
				) : (
					<Button
						variant='ghost'
						className='text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 h-auto'>
						<User className='h-4 w-4' />
					</Button>
				)}
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
