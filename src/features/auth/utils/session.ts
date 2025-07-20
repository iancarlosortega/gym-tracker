import { type JWTPayload, jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/env';
import { SESSION_COOKIE_NAME } from '../constants/session';

interface SessionPayload extends JWTPayload {
	user: UserPayload;
	expiresAt: Date;
}

interface UserPayload {
	id: string;
}

const secretKey = env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function encrypt(payload: SessionPayload) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(encodedKey);
}

export async function decrypt(
	session: string | undefined = ''
): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(session, encodedKey, {
			algorithms: ['HS256'],
		});
		return payload as SessionPayload;
	} catch (error) {
		console.log('Failed to verify session', error);
		return null;
	}
}

export async function createSession(user: UserPayload) {
	const cookiesStore = await cookies();
	const expiresAt = new Date(Date.now() + SEVEN_DAYS);
	const session = await encrypt({ user, expiresAt });
	cookiesStore.set(SESSION_COOKIE_NAME, session, {
		httpOnly: true,
		secure: true,
		expires: expiresAt,
		sameSite: 'lax',
		path: '/',
	});
}
