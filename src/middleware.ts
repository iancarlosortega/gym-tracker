import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { adminRoutes, authRoutes } from '@/features/auth/constants/routes';
import { SESSION_COOKIE_NAME } from '@/features/auth/constants/session';
import { USER_ROLES } from '@/features/auth/constants/user';
import { decrypt, updateSession } from '@/features/auth/utils/session';

export async function middleware(request: NextRequest) {
	const { pathname, search } = new URL(request.url);
	const cookiesStore = await cookies();

	const cookie = cookiesStore.get(SESSION_COOKIE_NAME)?.value;
	const session = await decrypt(cookie);

	const response = await updateSession(request);

	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	if (session && isAuthRoute) {
		const redirectUrl = new URL('/', request.url);
		return NextResponse.redirect(redirectUrl);
	}

	const isProtectedRoute = pathname === '/';

	if (!session && isProtectedRoute) {
		const loginUrl = new URL('/login', request.url);
		const redirectParam = `${pathname}${search}`;
		loginUrl.searchParams.set('redirect', redirectParam);
		return NextResponse.redirect(loginUrl);
	}

	const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
	const isUserAdmin = session?.user.role === USER_ROLES.ADMIN.value;

	if (!isUserAdmin && isAdminRoute) {
		const redirectUrl = new URL('/', request.url);
		return NextResponse.redirect(redirectUrl);
	}

	return response;
}

export const config = {
	matcher: [
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
	],
};
