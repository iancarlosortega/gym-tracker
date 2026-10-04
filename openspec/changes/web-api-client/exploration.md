# Exploration — web-api-client

**Date**: 2026-10-03
**Change**: `web-api-client`
**Phase**: explore (no implementation)

## 1. Problem

Every web page reads `API_ORIGIN` at request time (`await connection()` + `process.env.API_ORIGIN`) and passes it down as an `apiBaseUrl` prop. Each container then rebuilds its gateways with `useMemo(() => new HttpXGateway(apiBaseUrl), [apiBaseUrl])`. As a result, `apiBaseUrl` appears in 17 files: 5 pages, 6 containers and 6 gateways.

Server state is hand-rolled. Every container repeats the same `useEffect` + `useState` triplet (data / loading / unreachable). There is no cache, no dedupe, no retry, no refetch on focus or reconnect, and nothing stops a stale response from landing after unmount.

## 2. Decisions already taken by the owner (2026-10-03)

- The API base URL comes from **`NEXT_PUBLIC_API_URL`** and is inlined at `next build`. This is an explicit exception to the earlier "runtime envs only" rule. It is acceptable because there is one production environment and compose builds the web image on the VPS. Cost accepted: changing the API domain means rebuilding the web image.
- The HTTP client is **axios**, created once with `axios.create({ baseURL })` as a module singleton (the pattern the owner uses in web-admin-dashboard).
- Server state moves to **TanStack Query**.
- Origins stay as they are: the web and the API remain on separate subdomains, with CORS (`apps/api/src/main.ts:32`, `credentials: true`) and the cross-subdomain session cookie unchanged.

## 3. Current state

| Gateway (apps/web/src/features) | Implements a port? | Used by |
|---|---|---|
| `auth/infrastructure/http-sign-in.gateway.ts` | yes, `SignInPort` | `SignInUseCase` |
| `measurement/infrastructure/http-set-sync.gateway.ts` | yes, domain `SetSyncGateway` | `SyncPendingSetsUseCase` (offline queue) |
| `workouts/infrastructure/http-workout.gateway.ts` | no | workout page, statistics, recompute page |
| `statistics/infrastructure/http-statistics.gateway.ts` | no | week + progression containers |
| `recompute/infrastructure/http-recompute.gateway.ts` | no (also defines `StalePreviewError`) | recompute container |
| `push/infrastructure/http-push.gateway.ts` | no | workout page, `EnablePocketedAlertsUseCase` |

- Every gateway takes `(baseUrl, fetchImpl = sessionAwareFetch)`. `sessionAwareFetch` (`auth/infrastructure/session-aware-fetch.ts`) redirects any 401 to `/sign-in?next=<path>`.
- `workout-page.container.tsx` is the offline-first composition root. It wires use cases over IndexedDB plus gateways, and it has to keep working with the API unreachable.
- `public/sw.js` intercepts fetches for caching but never calls the API through a gateway. Axios's default XHR adapter is not a concern there.
- Only `http-sign-in.gateway.test.ts` tests a gateway directly. It injects `fetchImpl`.

## 4. Approaches

### A. Keep gateways and inject the axios instance (minimal)
Gateways take an `AxiosInstance` (defaulting to the singleton) instead of `baseUrl`. Containers drop `apiBaseUrl` but keep their `useEffect` plumbing.
- Pro: small diff.
- Con: the server-state problems remain, and the gateway classes become pure ceremony for read-only endpoints.

### B. Split by role (recommended)
- **Port adapters stay as classes**: `HttpSignInGateway` and `HttpSetSyncGateway` implement application or domain ports. They use the axios singleton internally, and tests inject an instance.
- **Read-only and UI-driven endpoints become feature API modules**: `features/<f>/infrastructure/<f>.api.ts` exports plain functions such as `getWeek()` that call the singleton. Each feature also exposes query hooks (`features/<f>/presentation/hooks/use-week-statistics.ts`) plus a key factory. Recompute preview and confirm become `useMutation`.
- The workout page keeps its use-case wiring because it is offline-first. Its `HttpPushGateway` and `HttpWorkoutGateway` usages switch to the API functions.
- Pro: the hexagonal boundary is kept where a port actually exists, and the ceremony goes away where none does.
- Con: a larger diff, and it touches every feature.

### C. Everything through TanStack Query, including the offline sync
- Con: TanStack Query's offline mutation persistence would duplicate the IndexedDB queue and its domain rules. Rejected.

## 5. Risks

- `NEXT_PUBLIC_API_URL` is missing at build time, so `baseURL` becomes `undefined` and requests go to relative paths on the web origin. Fix: fail fast when the client module is created, and add `ARG` to the `build` stage of `apps/web/Dockerfile`.
- The 401 redirect moves from `sessionAwareFetch` to an axios response interceptor. Its behaviour must be preserved: no redirect loop on `/sign-in`, and a full navigation.
- Axios throws on non-2xx, whereas the gateways currently branch on `response.ok` and `response.status` (for example the 409 for `StalePreviewError`). Error mapping has to be ported deliberately.
- Strict TDD is on. The tests that inject `fetchImpl` need an axios equivalent; the candidate is an injected instance with a mock adapter, or `axios-mock-adapter`.
- Size: about 17 files touched plus new hooks, which could approach the 400-line budget. The delivery strategy is `single-pr`, so the tasks phase must forecast the size.

## 6. Recommendation

Approach **B**.
