# Tasks — web-api-client

**Inputs**: `specs/web-api-access/spec.md`, `design.md`
**Mode**: strict TDD. Every behavioural task starts with a failing test (`pnpm --filter @gym/web test`).
**Delivery**: work-unit commits on `main`. Ian reviews each slice locally before its commit; nothing is pushed until he says so.
**Checks per slice**: `pnpm --filter @gym/web test`, `pnpm typecheck`, `pnpm lint`.

## Slice 1 — Client, test double, query provider, build config

- [x] 1.1 Add the dependencies `axios@^1.20` and `@tanstack/react-query@^5.104` to `apps/web`.
- [x] 1.2 Add `lib/testing/stub-adapter.ts` (design §7). RED first: a test showing that a stubbed 409 rejects with an `AxiosError` whose `response.status` is 409 and that a 200 resolves. This settles research uncertainty U1.
- [x] 1.3 Add `lib/api-client.ts` with `createApiClient` and `apiClient` (design §2). Write each RED test before the code:
  - the request goes to `baseURL` + path with `withCredentials: true`;
  - a 401 calls `onUnauthenticated` and still rejects;
  - a 401 with `skipSignInRedirect` does not call it;
  - a non-401 error does not call it;
  - an empty `NEXT_PUBLIC_API_URL` throws an error naming the setting.
- [x] 1.4 Port the `redirectToSignIn` scenarios from `session-aware-fetch.test.ts` to `api-client.test.ts`: the full navigation to `signInPathFor(path + search)`, and no navigation on the sign-in route. Do not delete the old file yet (5.1).
- [x] 1.5 Add `lib/query-client.ts` (`staleTime` 30 s, `refetchOnWindowFocus`, `retry` skips 401) with a test for the retry predicate. Add `app/providers.tsx` and wrap `layout.tsx`.
- [ ] 1.6 Build config (Dockerfile and compose done; `.env.example` and `apps/web/.env.local` pending, because agent permissions block reading `.env*` files, so Ian adds them):
  - `ARG` + `ENV NEXT_PUBLIC_API_URL` in the `build` stage of `apps/web/Dockerfile`;
  - `compose.yaml` `web.build.args`;
  - document it in `.env.example`;
  - local `apps/web/.env.local`.

Commit: `feat(web): add the axios api client and query provider`

## Slice 2 — Port adapters on the client

- [x] 2.1 `HttpSignInGateway(client = apiClient)`. Rewrite `http-sign-in.gateway.test.ts` against `createApiClient({ adapter: stub })`:
  - a POST to the API sign-in route carrying the credentials and `skipSignInRedirect`;
  - a 401 maps to `InvalidCredentialsError` and `onUnauthenticated` is not called;
  - a 500 rethrows.
- [x] 2.2 `HttpSetSyncGateway(client = apiClient)`. Add a test for the push request shape and for the returned ids. Keep the domain `SetSyncGateway` contract unchanged.
- [x] 2.3 Drop `apiBaseUrl` from `sign-in.container.tsx` and `app/sign-in/page.tsx`, along with `connection()` if it served only the URL.

Commit: `refactor(web): move the port adapters onto the api client`

## Slice 3 — Statistics and workouts as API functions and queries

- [ ] 3.1 `workouts/infrastructure/workouts.api.ts` with `getCurrentWorkout`, `startWorkout`, `getExercises` and `getEquipment`. Response types move here. RED first: the test pins the existing `getCurrentWorkout` "none → `null`" mapping, read from the current gateway before it is removed.
- [ ] 3.2 `statistics/infrastructure/statistics.api.ts` with `getWeekComparison` and `getExerciseProgression`. Response types move here.
- [ ] 3.3 `workouts/presentation/queries.ts` (keys, `useExercises`) and `statistics/presentation/queries.ts` (keys, `useWeekComparison`, `useExerciseProgression`). The key test covers this: equal instants give equal keys, and different inputs give different keys.
- [ ] 3.4 Rewrite `week-statistics.container.tsx` and `exercise-progression.container.tsx` on the hooks. They keep the existing loading and unreachable copy, and the `apiBaseUrl` props and `useMemo` gateways go. Their pages drop `API_ORIGIN` and `connection()`.
- [ ] 3.5 Delete `http-statistics.gateway.ts`. `http-workout.gateway.ts` stays until slice 4, because the workout and recompute pages still use it.

Commit: `refactor(web): read statistics through queries`

## Slice 4 — Recompute, push and the workout page

- [ ] 4.1 Move `StalePreviewError` to `recompute/application/stale-preview.error.ts`.
- [ ] 4.2 `recompute/infrastructure/recompute.api.ts` with `previewRecompute` and `applyRecompute`. RED first: a 409 on apply rejects with `StalePreviewError`, and any other failure rethrows.
- [ ] 4.3 `recompute/presentation/queries.ts`: the preview and apply mutations. A successful apply invalidates `statisticsKeys.all`, which a test covers.
- [ ] 4.4 Rewrite `recompute.container.tsx` and `recompute-page.container.tsx` on the hooks, keeping the copy. The "history changed" message is still keyed off `StalePreviewError`. The page drops `API_ORIGIN`.
- [ ] 4.5 `push/infrastructure/push.api.ts` with `getPushState`, `registerPushSubscription`, `scheduleRestAlert` and `cancelRestAlert`.
- [ ] 4.6 Rewire `workout-page.container.tsx`:
  - the initial reads become `workouts.api` functions;
  - the push calls become `push.api` functions;
  - `EnablePocketedAlertsUseCase` gets an object literal of push functions;
  - `new HttpSetSyncGateway()` is constructed with no URL;
  - the offline wiring is otherwise unchanged.
  
  Drop `apiBaseUrl` from this container and from `app/workout/page.tsx`.
- [ ] 4.7 Delete `http-recompute.gateway.ts`, `http-push.gateway.ts` and `http-workout.gateway.ts`.

Commit: `refactor(web): move recompute, push and the workout page onto the api client`

## Slice 5 — Remove the old plumbing

- [ ] 5.1 Delete `session-aware-fetch.ts` and its test. Their scenarios now live in `api-client.test.ts` (1.4).
- [ ] 5.2 Remove `API_ORIGIN` from the web service in `compose.yaml`. `rg 'apiBaseUrl|API_ORIGIN|sessionAwareFetch' apps/web` must return nothing.
- [ ] 5.3 Device check (manual, by Ian): sign in on the phone, then check statistics, recompute and an offline set synced after reconnect.

Commit: `chore(web): remove the api base url plumbing`

## Review Workload Forecast

Estimates count added and deleted lines, excluding `pnpm-lock.yaml`.

| Slice | Estimate | Notes |
|---|---|---|
| 1 | ~230 | new client, tests, provider, build config |
| 2 | ~150 | two adapters plus their tests |
| 3 | ~380 | moved response types inflate it; mostly moves and deletes |
| 4 | ~420 | recompute mutation, push, workout page rewire, three gateway deletions |
| 5 | ~110 | deletions |
| **Total** | **~1,290** | |

- 400-line budget risk: **High**. The whole change is about 3× the budget, and slice 4 alone sits at about the limit.
- Chained PRs recommended: N/A. Delivery is commits on `main`, with no PRs.
- Decision needed before apply: **Yes**. Under `single-pr`, the total exceeds the budget. The options are to record a `size:exception`, or to treat each slice as its own review unit (Ian reviews and approves each commit separately). The second keeps every review near or under 400.
