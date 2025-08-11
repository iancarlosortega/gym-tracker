import { NextResponse } from 'next/server';
import { deleteSession } from '@/features/auth/utils/session';

export async function GET() {
	try {
		await deleteSession();
		return NextResponse.redirect(
			new URL(
				'/login',
				process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
			)
		);
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.redirect(
			new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
		);
	}
}
