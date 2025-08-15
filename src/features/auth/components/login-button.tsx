import Link from 'next/link';
import { Button } from '@/features/shared/components/button';

interface Props {
	name: string;
	label: string;
	icon: React.ReactNode;
}

export const LoginButton = ({ name, label, icon }: Props) => {
	return (
		<Button asChild variant='outline' className='w-full py-5 hover:bg-muted'>
			<Link href={`/api/login/${name}`}>
				<span>{label}</span>
				{icon}
			</Link>
		</Button>
	);
};
