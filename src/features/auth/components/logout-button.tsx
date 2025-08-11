import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const LogoutButton = () => {
	return (
		<Button
			asChild
			variant='ghost'
			className='w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-600/10'>
			<Link href='/api/logout' className='flex items-center'>
				<LogOut className='h-4 w-4 mr-2' />
				Sign out
			</Link>
		</Button>
	);
};
