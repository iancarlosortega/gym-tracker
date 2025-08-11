import { type JWTPayload, jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { SESSION_COOKIE_NAME } from '@/features/auth/constants/session';
import type { UserRole } from '@/features/users/types/roles';

interface SessionPayload extends JWTPayload {
	user: UserPayload;
	expiresAt: Date;
}

interface UserPayload {
	id: string;
	isActive: boolean;
	role: UserRole;
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

export async function updateSession(request: NextRequest) {
	const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	const payload = await decrypt(session);

	if (!session || !payload) return;

	// Refresh the session so it doesn't expire
	payload.expiresAt = new Date(Date.now() + SEVEN_DAYS);
	const res = NextResponse.next();
	res.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: await encrypt(payload),
		httpOnly: true,
		secure: true,
		expires: payload.expiresAt,
		sameSite: 'lax',
	});
	return res;
}

export async function getSession(): Promise<SessionPayload | null> {
	const cookiesStore = await cookies();
	const session = cookiesStore.get(SESSION_COOKIE_NAME)?.value;
	return await decrypt(session);
}

export async function deleteSession() {
	const cookiesStore = await cookies();
	cookiesStore.delete(SESSION_COOKIE_NAME);
}
