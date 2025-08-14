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
			<body className={`${poppins.className} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
