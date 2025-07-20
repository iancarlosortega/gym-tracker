import { OAuth2RequestError } from 'arctic';
import { cookies } from 'next/headers';
import { getAccountByGoogleIdUseCase } from '@/features/accounts/use-cases/google';
import { type GoogleUser, googleAuth } from '@/features/auth/utils/google-auth';
import { createSession } from '@/features/auth/utils/session';
import { createGoogleUserUseCase } from '@/features/users/use-cases/google';

export async function GET(request: Request): Promise<Response> {
	const cookiesStore = await cookies();
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookiesStore.get('google_oauth_state')?.value ?? null;
	const codeVerifier = cookiesStore.get('google_code_verifier')?.value ?? null;

	if (
		!code ||
		!state ||
		!storedState ||
		state !== storedState ||
		!codeVerifier
	) {
		return new Response(null, {
			status: 400,
		});
	}

	try {
		const tokens = await googleAuth.validateAuthorizationCode(
			code,
			codeVerifier
		);
		const accessToken = tokens.accessToken();

		const response = await fetch(
			'https://openidconnect.googleapis.com/v1/userinfo',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const googleUser: GoogleUser = await response.json();

		const [existingAccount] = await getAccountByGoogleIdUseCase(googleUser.sub);

		if (existingAccount) {
			await createSession(existingAccount);
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/',
				},
			});
		}

		const newUser = await createGoogleUserUseCase(googleUser);
		await createSession(newUser);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/',
			},
		});
	} catch (error) {
		console.log('Error:', error);
		// the specific error message depends on the provider
		if (error instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400,
			});
		}
		return new Response(null, {
			status: 500,
		});
	}
}
