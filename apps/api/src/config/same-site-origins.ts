import { getDomain, getHostname } from 'tldts'

/**
 * Include the private section of the public suffix list.
 *
 * Browsers scope cookies with the full list, so `vercel.app` and `railway.app`
 * are suffixes in their own right: two apps beneath one of them cannot set
 * cookies for each other. Ignoring the private section would declare that
 * deployment valid and the failure would only appear on the device.
 */
const PUBLIC_SUFFIX_OPTIONS = { allowPrivateDomains: true } as const

/**
 * Whether two origins share a registrable domain.
 *
 * This is the constraint that makes cookie authentication work on the user's
 * iPhone. Safari treats a cookie set by an API on an unrelated host as
 * third-party and will not send it, so a frontend on one provider's domain and
 * an API on another's cannot hold a session between them no matter what the
 * cookie attributes say.
 *
 * The check uses the public suffix list rather than comparing the last two
 * labels: `gym.vercel.app` and `api.vercel.app` look related and are not,
 * because `vercel.app` is itself a public suffix.
 */
export function shareRegistrableDomain(frontendOrigin: string, apiOrigin: string): boolean {
  const frontendHost = hostOf(frontendOrigin)
  const apiHost = hostOf(apiOrigin)

  const frontendDomain = getDomain(frontendHost, PUBLIC_SUFFIX_OPTIONS)
  const apiDomain = getDomain(apiHost, PUBLIC_SUFFIX_OPTIONS)

  if (frontendDomain === null || apiDomain === null) {
    // No registrable domain: a bare hostname such as localhost. Same-site only
    // when the hosts are identical, which keeps development working.
    return frontendHost === apiHost
  }

  return frontendDomain === apiDomain
}

/**
 * Refuse to start when the configured origins cannot hold a session together.
 *
 * Failing at boot is deliberate. The alternative is an application that starts
 * cleanly, serves pages, and silently cannot keep anyone signed in on the one
 * device it was built for.
 */
export function assertSameSiteOrigins(frontendOrigin: string, apiOrigin: string): void {
  if (!shareRegistrableDomain(frontendOrigin, apiOrigin)) {
    throw new Error(
      [
        'Refusing to start: the frontend and API origins do not share a registrable domain,',
        'so the session cookie would be treated as third-party and authentication would fail.',
        `  frontend: ${frontendOrigin}`,
        `  api:      ${apiOrigin}`,
        'Serve both from one domain you control, for example gym.example.com and api.gym.example.com.',
      ].join('\n'),
    )
  }
}

function hostOf(origin: string): string {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    throw new Error(`Not a usable origin: ${JSON.stringify(origin)}.`)
  }
  return getHostname(url.hostname) ?? url.hostname
}
