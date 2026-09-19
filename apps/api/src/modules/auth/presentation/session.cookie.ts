import type { CookieOptions } from 'express'

export const SESSION_COOKIE_NAME = 'gym_session'

const MILLISECONDS_PER_DAY = 86_400_000

/**
 * The cookie the session id travels in.
 *
 * HttpOnly keeps it out of page scripts, which is the whole point: Safari may
 * evict script-writable storage, and a token kept there would sign the user out
 * after a couple of weeks away. SameSite=Lax is only safe because the frontend
 * and API share a registrable domain, which startup refuses to run without.
 */
export function sessionCookieOptions(secure: boolean, lifetimeDays: number): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: lifetimeDays * MILLISECONDS_PER_DAY,
  }
}

export function clearedSessionCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/' }
}
