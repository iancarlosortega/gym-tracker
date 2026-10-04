export const SIGN_IN_PATH = '/sign-in'

/**
 * Where to go after signing in, from a `next` query parameter.
 *
 * The parameter is attacker-controllable: a link to the sign-in page with
 * `next=https://evil.example` would otherwise send a freshly signed-in user
 * off-site. Only a same-origin relative path is honoured, anything else —
 * absent, absolute, protocol-relative, or the sign-in page itself — falls back
 * to the home page.
 */
export const safeNextPath = (next: string | null | undefined): string => {
  if (next === undefined || next === null) {
    return '/'
  }

  // Browsers read a backslash as a slash, so `/\evil.example` is protocol-relative.
  // Control characters are stripped by URL parsing and can hide a second slash.
  const startsWithOneSlash = next.startsWith('/') && !next.startsWith('//')
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting them is the point
  const hasUnsafeCharacter = /[\\\u0000-\u001f\u007f]/.test(next)

  if (!startsWithOneSlash || hasUnsafeCharacter) {
    return '/'
  }

  if (
    next === SIGN_IN_PATH ||
    next.startsWith(`${SIGN_IN_PATH}?`) ||
    next.startsWith(`${SIGN_IN_PATH}/`)
  ) {
    return '/'
  }

  return next
}

/** The sign-in page, remembering where the user was headed. */
export const signInPathFor = (currentPath: string): string =>
  `${SIGN_IN_PATH}?next=${encodeURIComponent(currentPath)}`
