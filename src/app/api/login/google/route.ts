import { generateCodeVerifier, generateState } from 'arctic';
import { cookies } from 'next/headers';
import { googleAuth } from '@/features/auth/utils/google-auth';

export async function GET(): Promise<Response> {
	const cookiesStore = await cookies();
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = googleAuth.createAuthorizationURL(state, codeVerifier, [
		'profile',
		'email',
	]);

	cookiesStore.set('google_oauth_state', state, {
		secure: true,
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
	});

	cookiesStore.set('google_code_verifier', codeVerifier, {
		secure: true,
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10,
	});

	return Response.redirect(url);
}
