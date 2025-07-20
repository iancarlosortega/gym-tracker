import Link from 'next/link';

interface Props {
	name: string;
	label: string;
	icon: React.ReactNode;
}

export const LoginButton = ({ name, label, icon }: Props) => {
	return (
		<Link
			href={`/api/login/${name}`}
			className='rounded-md border px-4 py-2 w-full flex items-center gap-x-2 justify-center hover:bg-white/10 transition-colors'>
			<span>{label}</span>
			{icon}
		</Link>
	);
};
