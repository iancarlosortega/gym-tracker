import { Header } from '@/features/shared/components/header';

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<Header />
			<div className='min-h-screen bg-gray-950'>{children}</div>
		</>
	);
}
