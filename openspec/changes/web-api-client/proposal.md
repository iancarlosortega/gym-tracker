# Proposal — web-api-client

**Date**: 2026-10-03
**Change**: `web-api-client`
**Inputs**: `exploration.md`, `research.md` (revision 1, done), `state.yaml` preproposal (all decisions confirmed)

## 1. Why

Every web page currently does three things just to reach the API. It reads `API_ORIGIN` at request time, passes it down as an `apiBaseUrl` prop, and has each container rebuild its gateways from that prop. As a result the URL is threaded through 17 files, and every new screen repeats the same plumbing. Server state is also hand-rolled: each container repeats `useEffect` + `useState`, with no cache, dedupe or retry, and with no refetch when the phone comes back online at the gym.

The owner wants the pattern used in their other apps: one HTTP client with a base URL, imported wherever it is needed.

## 2. What this change delivers

- **One API client.** An `axios.create` module singleton built by a `createApiClient` factory, with base URL `NEXT_PUBLIC_API_URL` and `withCredentials: true`. A response interceptor sends any 401 to `/sign-in?next=<path>`, which replaces `sessionAwareFetch`. The factory accepts an `adapter`, so tests inject a stub.
- **Build-time API URL.** `NEXT_PUBLIC_API_URL` is supplied as a Docker build arg (`apps/web/Dockerfile` build stage, `compose.yaml` `build.args`) and set in `.env.example`. Creating the client fails fast when the value is missing.
- **TanStack Query.** A `'use client'` provider in the root layout holds a browser-singleton `QueryClient` (`staleTime` 30 s, refetch on window focus). Each feature exposes `queryOptions` factories and hooks.
- **Gateways split by role.**
  - Port adapters stay as classes and use the client internally: `HttpSignInGateway` (→ `SignInPort`) and `HttpSetSyncGateway` (→ domain `SetSyncGateway`).
  - The read and UI-driven gateways become feature API modules of plain functions: workouts, statistics, recompute and push. Recompute preview and confirm become mutations. The 409 → `StalePreviewError` and sign-in 401 → `InvalidCredentialsError` mappings are ported explicitly.
- **Cleanup.** Pages and containers lose the `apiBaseUrl` prop and the `API_ORIGIN` reads. `connection()` stays only where something else still needs request time.

## 3. Scope

### In scope

- Every web feature that talks to the API: auth, measurement sync, workouts, statistics, recompute and push.
- The web Dockerfile, compose and `.env.example` changes for the build arg.
- Tests for the client (base URL, credentials, 401 redirect, no redirect loop on `/sign-in`) and for every ported status mapping.

### Out of scope

- API changes. Origins, CORS (`FRONTEND_ORIGIN`, `credentials: true`) and the cross-subdomain cookie stay as they are.
- The offline queue. IndexedDB plus `SyncPendingSetsUseCase` stay; TanStack offline mutation persistence is not used (approach C rejected).
- SSR prefetching and hydration with TanStack Query.
- A typed OpenAPI client.

## 4. Decisions (confirmed by the owner, 2026-10-03)

| # | Decision |
|---|---|
| D1 | `NEXT_PUBLIC_API_URL` is inlined at build. Accepted cost: changing the API domain requires rebuilding the web image. One production environment exists. |
| D2 | The client is axios, created once with `axios.create`. |
| D3 | Approach B: port adapters stay as classes, and everything else becomes API functions plus query hooks. |
| D4 | Test doubles: a stub `adapter` injected into `createApiClient`. No `axios-mock-adapter`. |
| D5 | TanStack Query defaults: `staleTime` 30 s, `refetchOnWindowFocus` on. |

## 5. Risks

| Risk | Mitigation |
|---|---|
| Build arg missing, so requests go to the web origin | Fail fast in the client module; `ARG` + `ENV` in the build stage |
| The 401 redirect regresses (loop on `/sign-in`, soft navigation keeps signed-in cache) | Port the existing `sessionAwareFetch` tests to the interceptor first (strict TDD) |
| Axios rejects non-2xx, so a status mapping is silently lost | One test per mapped status (409 recompute, 401 sign-in) before the code moves |
| The workout page is offline-first | Keep its use-case wiring; only swap what its HTTP adapters use internally |
| Size is near the 400-line budget with `single-pr` delivery | The tasks phase forecasts it; split into work-unit commits either way |

## 6. Rollback

Every slice is a set of local commits on `main`, reviewed by the owner before any push. Rolling back means reverting those commits. No data or API contract changes.
