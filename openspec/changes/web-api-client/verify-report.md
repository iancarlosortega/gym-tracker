# Verify report — web-api-client

**Date**: 2026-10-04
**Against**: `specs/web-api-access/spec.md`, `tasks.md`
**Candidate**: `12c21ed` (main, unpushed)
**Verdict**: **PASS WITH WARNINGS**. No blockers. Two warnings on offline and failure timing, plus one manual check that is still pending.

## Automated evidence

| Check | Result |
|---|---|
| `pnpm test` (workspace) | domain 205, web 139, api 197 — all pass |
| `pnpm typecheck` | clean |
| `pnpm lint` (biome, no-barrels, import placement) | clean |
| `next build` with `NEXT_PUBLIC_API_URL` set | ok; value inlined in 5 client chunks |
| `next build` with `NEXT_PUBLIC_API_URL` empty | **fails**: `NEXT_PUBLIC_API_URL is not set, so the app has no server to talk to.` (prerendering `/workout`) |
| `rg 'apiBaseUrl\|API_ORIGIN\|sessionAwareFetch' apps/web` | no matches in source |

## Scenarios

| Requirement / scenario | Status | Evidence |
|---|---|---|
| API location — configured address is used | ✅ | `api-client.test.ts` "sends every request to the API…"; build inlines the value |
| API location — missing address fails loudly | ✅ stronger than spec | `requireApiUrl` test; the build itself refuses, so a misconfigured image can't ship |
| Session — authenticated read carries the cookie | ✅ | `withCredentials: true` asserted in `api-client.test.ts` |
| Lapsed session — redirect with return path | ✅ | `redirectToSignIn` test asserts `/sign-in?next=%2Fstatistics%3Fweek%3D2` exactly |
| Lapsed session — no loop on sign-in | ✅ | `redirectToSignIn` "stays put on the sign-in page itself" |
| Lapsed session — wrong credentials are not a lapsed session | ✅ | `http-sign-in.gateway.test.ts`: 401 → `InvalidCredentialsError`, `onUnauthenticated` not called; the container maps it to `invalid-credentials` (inspection) |
| Distinct failures — stale recompute preview | ✅ | `recompute.api.test.ts` 409 → `StalePreviewError`, 500 not disguised; the container switches to `StalePreviewNotice` on it (inspection) |
| Distinct failures — unreachable server | ⚠️ | containers render the existing copy on `isError` (inspection). See W1 and W2 |
| Reads — returning within 30 s reuses data | ✅ config | `staleTime: 30_000`; cached data renders with no pending state (TanStack contract) |
| Reads — foreground refresh | ✅ config | `refetchOnWindowFocus: true` |
| Reads — one request for shared data | ✅ | both statistics containers and recompute use the single `workoutsKeys.exercises()` key via `useExercises` |
| Offline logging unaffected | ✅ automated / ⏳ device | workout page keeps its use-case wiring and the queue/sync tests pass; device check 5.3 pending |

## Warnings

- **W1 — Unreachable server is reported late.** Queries retry 3 times with TanStack's default backoff (1 s, 2 s, 4 s), so "Could not reach the server" appears about 7 s after the first failure. Before this change it appeared immediately. That's acceptable under the spec wording, but it is a visible change on the phone.
- **W2 — Offline reads pause instead of failing.** TanStack's default `networkMode: 'online'` pauses queries while the browser reports no network. With no connectivity, the statistics and recompute screens stay on "Reading…" rather than showing the unreachable copy. This is inferred from the library's documented defaults and has not been exercised on a device. The workout page is not affected because it doesn't use queries. If this matters, the fix is either to render a "you're offline" state from `fetchStatus === 'paused'` or to set `networkMode: 'always'` for these reads.

## Tasks

- 24/25 checked.
- **1.6** is done in practice but its checkbox is still open: Ian edited `.env.example` in `12c21ed`, and `.env.local` is local. Tick it at archive.
- **5.3** is the manual device check. Ian has deferred it until the app is finished.

## Deviations from design (recorded)

- §7: API functions take `client = apiClient` as their last parameter, instead of tests relying on `vi.mock`.
- §4: push exposes a `pushApi` object that keeps the old method names, plus a new `PushSubscriptionRegistry` port, so the use case no longer imports an infrastructure type.
- `/statistics` and `/workout` became static pages, because the `connection()` calls existed only for the URL.
