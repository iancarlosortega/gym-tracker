# Design — web-api-client

**Date**: 2026-10-03
**Inputs**: `proposal.md` (D1–D5), `research.md` (C1–C13), `specs/web-api-access/spec.md`
**Supersedes**: the "Runtime configuration is read at request time" bullet of `gym-tracker-mvp/design.md` §8, for the API address only.

## 1. Shape

```
apps/web/src/
├── lib/
│   ├── api-client.ts            createApiClient() + apiClient singleton
│   ├── api-client.test.ts
│   └── query-client.ts          browser-singleton QueryClient
├── app/
│   ├── providers.tsx            'use client' QueryClientProvider
│   └── layout.tsx               wraps children in <Providers>
└── features/<f>/
    ├── infrastructure/<f>.api.ts        plain functions over apiClient
    ├── infrastructure/<f>.api.test.ts
    └── presentation/queries.ts           queryOptions factories + hooks
```

Port adapters keep their files and class names:
- `auth/infrastructure/http-sign-in.gateway.ts` (`SignInPort`)
- `measurement/infrastructure/http-set-sync.gateway.ts` (`SetSyncGateway`)

## 2. The client

```ts
// lib/api-client.ts
export interface ApiClientOptions {
  readonly baseURL?: string
  readonly adapter?: AxiosAdapter        // tests only (D4)
  readonly onUnauthenticated?: () => void
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /** A 401 on this request is an answer, not a lapsed session. */
    readonly skipSignInRedirect?: boolean
  }
}

export const createApiClient = ({
  baseURL = requireApiUrl(),
  adapter,
  onUnauthenticated = redirectToSignIn,
}: ApiClientOptions = {}): AxiosInstance => {
  const client = axios.create({ baseURL, withCredentials: true, adapter })

  client.interceptors.response.use(undefined, (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401 && !error.config?.skipSignInRedirect) {
      onUnauthenticated()
    }
    return Promise.reject(error)
  })
  return client
}

export const apiClient = createApiClient()
```

- **`requireApiUrl()`** reads `process.env.NEXT_PUBLIC_API_URL` and throws `'NEXT_PUBLIC_API_URL is not set, so the app has no server to talk to.'` when it is empty. The read must be the literal `process.env.NEXT_PUBLIC_API_URL`, because Next only inlines literal member access [C1]. If the value were missing, axios would resolve relative paths against the page origin; failing fast is what satisfies the spec scenario "Missing address fails loudly".
- **`redirectToSignIn`** moves over from `session-aware-fetch.ts` unchanged: browser only, skipped on `/sign-in`, and a full navigation via `window.location.assign(signInPathFor(path + search))`. `signInPathFor` stays in `auth/application/sign-in-redirect.ts`.
- **Errors still reject after the redirect**, the same as `sessionAwareFetch` returned the response. Each caller's own failure handling still runs for the moment before the navigation lands.
- **Sign-in opts out** with `{ skipSignInRedirect: true }`. This replaces the current "pass the plain fetch" trick with an explicit flag at the call site.
- `session-aware-fetch.ts` and its test are deleted. Their scenarios move to `api-client.test.ts`.

### Server-side imports

`apiClient` is created when its module is first evaluated. Only `'use client'` modules import it. No page or Server Component reads the API (the session cookie lives in the browser, and `565c90b` moved the last server read out), so no server render triggers the browser-only paths.

## 3. Error mapping

Axios rejects every non-2xx response [C6]. Status mapping lives in the API function or the gateway, never in components:

```ts
// recompute.api.ts
export const applyRecompute = async (equipmentId: string, previewToken: string) => {
  try {
    const { data } = await apiClient.post<RecomputePreviewResponse>(
      `/equipment/${equipmentId}/recompute/apply`, { previewToken })
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) throw new StalePreviewError()
    throw error
  }
}
```

`StalePreviewError` moves to `recompute/application/stale-preview.error.ts`, matching `auth/application/invalid-credentials.error.ts`. The sign-in gateway maps 401 to `InvalidCredentialsError` the same way.

## 4. Feature API modules

Each gateway class maps to a module of functions:

| Old | New module | Functions |
|---|---|---|
| `HttpWorkoutGateway` | `workouts/infrastructure/workouts.api.ts` | `getCurrentWorkout`, `startWorkout`, `getExercises`, `getEquipment` |
| `HttpStatisticsGateway` | `statistics/infrastructure/statistics.api.ts` | `getWeekComparison`, `getExerciseProgression` |
| `HttpRecomputeGateway` | `recompute/infrastructure/recompute.api.ts` | `previewRecompute`, `applyRecompute` |
| `HttpPushGateway` | `push/infrastructure/push.api.ts` | `getPushState`, `registerPushSubscription`, `scheduleRestAlert`, `cancelRestAlert` |

- Response types (`WeekComparisonResponse` etc.) move unchanged into the same modules.
- `getCurrentWorkout` keeps its current "no session → `null`" contract. I will check the exact status it maps during apply and carry the mapping over.
- `EnablePocketedAlertsUseCase` currently takes `HttpPushGateway`. It gets the same shape from an object literal of the push functions, `{ readState: getPushState, registerSubscription: registerPushSubscription }`, typed by the parameter the use case already declares. The use case itself does not change.

## 5. TanStack Query

```ts
// lib/query-client.ts
export const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true } } })
```

```tsx
// app/providers.tsx — 'use client'
let browserClient: QueryClient | undefined
const getQueryClient = () => (typeof window === 'undefined' ? makeQueryClient() : (browserClient ??= makeQueryClient()))
export const Providers = ({ children }: { children: ReactNode }) =>
  <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
```

This follows the singleton-in-the-browser pattern [C11]. `retry` keeps the library default (3) for queries, but a 401 is never retried:

```ts
retry: (count, error) => !(isAxiosError(error) && error.response?.status === 401) && count < 3
```

Each feature's `presentation/queries.ts` holds the key factories and the hooks:

```ts
export const statisticsKeys = {
  all: ['statistics'] as const,
  week: (weekStart: string) => [...statisticsKeys.all, 'week', weekStart] as const,
  progression: (exerciseId: string, from: string, to: string) =>
    [...statisticsKeys.all, 'progression', exerciseId, from, to] as const,
}

export const weekComparisonQuery = (weekStart: Date) =>
  queryOptions({
    queryKey: statisticsKeys.week(weekStart.toISOString()),
    queryFn: () => getWeekComparison(weekStart),
  })

export const useWeekComparison = (weekStart: Date) => useQuery(weekComparisonQuery(weekStart))
```

- Keys include every `queryFn` input [C12]. Dates are keyed as ISO strings so that equal instants share a cache entry.
- `workouts/presentation/queries.ts` exposes `useExercises()`. Both statistics containers use it, which satisfies the spec scenario "ask once".
- Recompute uses `useMutation` for preview and for apply. On apply success it invalidates `statisticsKeys.all`, because recompute changes historic loads.

### Containers

The statistics and recompute containers replace their `useEffect`/`useState` triplets with these hooks and map `isPending` / `isError` to the copy they render today. Presentational components do not change.

The **workout page stays a composition root**. It keeps `useMemo` wiring for the offline use cases (queue, clock, wake lock, sync), and in that wiring `new HttpSetSyncGateway()` takes no URL. Its initial `Promise.all` read becomes `getCurrentWorkout`, `getExercises` and `getEquipment`. It does not move to TanStack Query in this change: those three reads gate an offline-capable screen, and the existing failure → `unreachable` handling is a deliberate offline behaviour. Moving it there is left as a follow-up.

## 6. Port adapters

```ts
export class HttpSetSyncGateway implements SetSyncGateway {
  constructor(private readonly client: AxiosInstance = apiClient) {}
  async push(sessionId: string, sets: readonly LoggedSet[]) { /* client.post(...) */ }
}

export class HttpSignInGateway implements SignInPort {
  constructor(private readonly client: AxiosInstance = apiClient) {}
  async signIn(credentials: Credentials) {
    try { await this.client.post('/auth/sign-in', credentials, { skipSignInRedirect: true }) }
    catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) throw new InvalidCredentialsError()
      throw error
    }
  }
}
```

Tests construct them with `createApiClient({ baseURL: 'https://api.test', adapter: stub })`.

## 7. Test double (D4)

```ts
// lib/testing/stub-adapter.ts
export const stubAdapter = (respond: (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }) => {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const { status, data = null } = respond(config)
    const response = { status, statusText: String(status), data, headers: {}, config }
    if (config.validateStatus?.(status) ?? true) return response
    throw new AxiosError(`Request failed with status code ${status}`, undefined, config, undefined, response)
  }
  return { adapter, calls }
}
```

A custom adapter has to apply `validateStatus` itself; the built-in adapters do this through `settle`. That is the one piece of axios behaviour this double reproduces, and it is what lets the interceptor and the status mappings be tested for real. Research flagged this as **U1**, and the first red test confirms it.

API function tests (`statistics.api.test.ts` etc.) cannot inject a client into a module-level function. They use `vi.mock('@/lib/api-client', …)` to supply `createApiClient({ adapter: stub })`. Only the status-mapping functions and the gateways get tests; a plain pass-through GET does not need one.

## 8. Build and configuration

- `apps/web/Dockerfile`, build stage, before the `RUN … build` line:
  ```dockerfile
  ARG NEXT_PUBLIC_API_URL
  ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
  ```
- `compose.yaml` → `web.build.args.NEXT_PUBLIC_API_URL: https://${API_DOMAIN}`. The web service's `API_ORIGIN` runtime env is removed.
- `.env.example` documents `NEXT_PUBLIC_API_URL`. `apps/web/.env.local` (gitignored) sets `http://localhost:3001` for dev.
- Pages drop `await connection()` and `API_ORIGIN` wherever those existed only for the URL.

## 9. Delivery

This is one change delivered as work-unit commits on `main`, reviewed locally before each commit:

1. Client, stub adapter, provider and build config.
2. The auth and measurement port adapters move to the client.
3. Statistics and workouts move to API functions and hooks.
4. Recompute and push move to API functions and hooks, and the workout page is rewired.
5. `sessionAwareFetch`, the `apiBaseUrl` props and the `API_ORIGIN` reads are removed.

The tasks phase forecasts the line count.
