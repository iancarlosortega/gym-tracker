import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Providers from '@/providers/providers';
import './globals.css';

const poppins = Poppins({
	subsets: ['latin'],
	weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
	title: 'Gym Tracker',
	description: 'Track your gym workouts',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`${poppins.className} antialiased bg-gray-950`}>
				<Providers>
					<div className='min-h-screen bg-gray-950'>{children}</div>
				</Providers>
			</body>
		</html>
	);
}
