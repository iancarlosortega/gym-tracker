## Exploration: optimistic UI and the remaining polish

Scope: (1) optimistic updates wherever they make sense, (2) the Home headline for an open workout, (3) a user-defined routine order, (4) the display unit in Progress and Recompute. Archiving the old changes `gym-tracker-mvp` and `web-api-client` is handled separately.

### Current State

**Mutations (apps/web/src).**
- There are no server actions. Every write is an axios call from a client container.
- No mutation uses `onMutate`. Only `useChangeDisplayUnit` calls `setQueryData`; every other mutation is `await server → invalidateQueries`.
- Only set logging and workout finish are local-first, through IndexedDB.
- Default `networkMode` is `online`, so a mutation pauses offline. The exceptions are finish and sign-out, which use `always`.

| Mutation | Where | Flow today | Verdict |
|---|---|---|---|
| Display unit kg↔lb | `features/auth/presentation/queries.ts:17-24`, `profile.container.tsx:55`, `profile-details.tsx:57-62` | Waits for a CORS-preflighted PATCH `/auth/me`, then `setQueryData(['auth','me'])`. The radio is controlled by `me.displayUnit`, so it does not move until the server answers. `isPending` is unread. Offline it pauses forever. | **Optimistic.** It is a pure preference with an idempotent last-write-wins and a single key read by every consumer. |
| Start workout | `workouts/presentation/queries.ts:64-71`, the drawers in `app-shell`, `home`, `routines` | Waits for POST `/workouts`, then invalidates `['workouts']` (prefix), then `router.push('/workout')`. | **Not optimistic for the data**, because the server issues the session id. Navigate immediately to a pending workout screen instead, which is perceived speed. |
| Raw `startWorkout()` on the empty workout page | `workout-page.container.tsx:122-129` | No pending state at all. | Route it through `useStartWorkout` and show a pending state. |
| Finish workout | `queries.ts:49-61` | Already local-first: IndexedDB, then a fire-and-forget sync. `openWorkout()` hides queued finishes. | Already good. Make it navigate before the invalidate settles. |
| Log set | `workout-screen.container.tsx:273-318` | Already optimistic: a local row with `pending: true` and a client UUIDv7, then drain. | Keep it. |
| Catalog create, rename, archive (exercises, equipment), bar-weight correction | `catalog/presentation/queries.ts:34-91` | Waits for the server, then invalidates 4 keys, then closes the sheet. | **Rename and archive: optimistic** (`setQueryData` on the lists). **Create: optimistic, but only if the client generates ids.** Otherwise the server owns the id, so keep pending and close the sheet on success. **Bar-weight correction: not optimistic**, because it feeds the recompute preview/apply. |
| Routine create, rename, archive, entry add/change/remove/reorder | `routines/presentation/queries.ts:30-60`; `routine-editor.tsx:85,94` | Waits for the server, then invalidates `['routines']`. The up/down buttons stay disabled until it settles, so every tap waits a round trip. | **Optimistic: rename, archive, entry reorder, entry change (targets, rest), remove.** Create and add need server ids unless the client generates them. |
| Recompute preview/apply | `recompute/presentation/queries.ts:10-20` | `mutateAsync`, then invalidate `['statistics']`. | **Not optimistic.** The results are server-computed and gated by a token. |
| Sign-out, sign-in, push subscribe | various | Pending states | Not optimistic. |

**Query client** (`lib/query-client.ts:20-32`).
- Settings: `staleTime: 30_000`, `refetchOnWindowFocus: true`, retry at most 1 (never on 401), and no persister. The cache is lost on reload.
- Key factories exist per feature: `authKeys`, `catalogKeys`, `routinesKeys`, `workoutsKeys`, `statisticsKeys`. The keys `workouts.current` and `pending-sets` are inline literals (`workouts/presentation/queries.ts:30,39`).

**The offline queue is not React Query.**
- Storage: IndexedDB set repository and pending-finish store (`workouts/presentation/offline-work.ts:11-34`).
- Delivery is idempotent by client UUIDv7.
- Drains happen on mount and online (`useBackgroundSync`), after each logged set, on pull-to-refresh, and on finish.
- `mergeDone` overlays queued sets on server sets.

**The workout page bypasses React Query.**
- `workout-page.container.tsx:70-110` loads the session, routine, exercises and equipment into `useState`.
- `workout-screen.container.tsx:194-201` reads session sets directly.
- So there is no shared cache for Home to read "3 of 5 done", and every entry to `/workout` refetches from scratch.

**Tap latency that does not come from mutations.**
- The route files are static server components that render client containers. There is no `connection()`, no dynamic APIs and no `loading.tsx`. Links use default prefetch.
- A tab's first visit after reload, or after `client.clear()`, shows skeletons until the API answers. That is expected, but the cache is not persisted.
- `useOpenWorkout` awaits the API and then IndexedDB serially (`workouts/presentation/queries.ts:28-35`).
- Service worker (`public/sw.js`, `gym-shell-v3`):
  - Every non-static GET is **network-first with no timeout**. That covers HTML, `?_rsc=` payloads and **cross-origin API GETs**, which are also routed through `respondWith` (`:57,75-90`).
  - On a slow but not dead connection, every navigation waits on the network. The API GETs gain an extra hop and get nothing for it.
  - This plausibly explains "tap and delay" on the phone even when no mutation runs.

**Units.**
- The preference is stored in `user.display_unit` and read via `useDisplayUnit()` (`auth/presentation/queries.ts:15`). The helpers are in `lib/units.ts`.
- The API returns kilograms in the statistics, recompute, equipment and last-sets views.
- Places that still hardcode kg:
  - `statistics/presentation/containers/exercise-progression.container.tsx:97` has the literal `${point.value} kg`.
  - `statistics/presentation/components/progression-chart.tsx` charts raw kg values, with no unit in the aria-label or the caption.
  - `recompute/presentation/components/recompute-consequences.tsx:43-51,105-107` puts " kg" on the `to` side only.
  - `recompute.container.tsx` never reads the unit.

**Routine order.**
- The `routine` table has no position column (`apps/api/src/database/schema/routine.table.ts:7-15`). Only `routine_exercise.position` exists.
- `ListRoutinesUseCase` orders by name (`list-routines.use-case.ts:53`). `RoutineSortField = 'name' | 'createdAt'`.
- Up-next (`packages/domain/src/routines/services/up-next.service.ts:15-21`) breaks ties by `position`. Today that position is the array index of the name-sorted page (`list-routines.use-case.ts:59-61`).
- `PUT /routines/:id/order` reorders the entries inside a routine. Nothing reorders the routines themselves.

**Home headline.**
- `HomeHeadline` (`home/presentation/components/home-views.tsx:33-52`) only says "{upNext} is up next." or "Nothing planned yet."
- An open workout only disables the routine rows ("Finish the open one first.").
- Data for "Push day, 3 of 5 done":
  - `useOpenWorkout()` gives `{routineId}`, and `useRoutines()` gives the name and `entries[].targetSets`.
  - Done sets come from server `getSessionSets` merged with the IndexedDB queue (`mergeDone`). That has no query hook today.

**Tests.**
- Vitest with per-file jsdom, testing-library and user-event, plus `fake-indexeddb`.
- The stub axios adapter is `lib/testing/stub-adapter.ts`.
- The only container test with a QueryClient is `workout-screen.container.test.tsx`, which shows the pattern to reuse for hook tests.

### Affected Areas
- `apps/web/src/features/auth/presentation/queries.ts`, `profile.container.tsx`, `profile-details.tsx`: the optimistic unit switch.
- `apps/web/src/features/routines/presentation/queries.ts`, `routine-editor.tsx`, `routine-views.tsx`, `routines.container.tsx`: optimistic routine edits and the routine reorder UI.
- `apps/web/src/features/catalog/presentation/queries.ts` plus containers: optimistic rename and archive.
- `apps/web/src/features/workouts/presentation/queries.ts`, `workout-page.container.tsx`, `app-shell.container.tsx`: start navigation, and moving session data into the Query cache.
- `apps/web/src/features/home/presentation/*`: the open-workout headline plus a session-progress query.
- `apps/web/src/features/statistics/presentation/*` and `features/recompute/presentation/*`: the display unit.
- `apps/web/public/sw.js` plus `features/pwa/sw.test.ts`: the navigation strategy, and leaving cross-origin requests alone.
- `apps/web/src/lib/query-client.ts`: possibly persistence and the default `networkMode`.
- Domain `packages/domain/src/routines/*`, API `apps/api/src/modules/routines/*`, and a Drizzle migration `0002_*`: the `routine.position` column, the reorder use case and the endpoint.

### Approaches
1. **TanStack `onMutate` cache writes with snapshot and rollback** for each optimistic mutation, plus the shared `invalidate` on settle.
   - Pros: every consumer of the key updates at once, which matters most for the unit, which is read app-wide. It fits the existing key factories.
   - Cons: boilerplate per mutation, and care is needed with prefix invalidation racing an in-flight optimistic write.
   - Effort: Medium.
2. **The `variables`/`useMutationState` pattern**: render pending variables in the UI without touching the cache.
   - Pros: no rollback code. Cons: only the component that renders the variables sees the change. The unit is read in many places, so this does not fit.
   - Effort: Low-Medium.
3. **React 19 `useOptimistic` in components.**
   - Pros: no cache changes. Cons: it reverts when the transition ends, it is scoped to a component, and it duplicates TanStack.
   - Effort: Medium.

### Recommendation
- **Approach 1** for the cache-shared mutations: unit, routine rename/archive/reorder/entry edits, catalog rename/archive.
- **Approach 2** where only one surface shows the result: create forms, if ids stay server-issued.
- Pair it with two perceived-latency fixes:
  - Start-workout navigates to a pending workout screen right away.
  - The service worker stops intercepting cross-origin API GETs and adds a short network timeout to navigation fallbacks.
- Move the open session into React Query, so Home can derive the headline and `/workout` stops refetching cold.
- Routine order: add a `position` column on `routine`, backfilled alphabetically. Add `PUT /routines/order`, which takes the full id list. Optimistic reorder on the web. Up-next ties use the real position.
- Units: convert the kilogram API values in the web via `kilogramsToDisplay` and label them. The API stays canonical kg.

### Research recommended (lane: optimistic-updates)
1. TanStack Query v5: the recommended `onMutate`/`onError`/`onSettled` shape, and `cancelQueries` races with prefix invalidation and concurrent mutations on the same key (rapid up/down reorder taps).
2. `mutationKey` plus `isMutating` gating, so a settle-invalidate does not clobber a newer optimistic state.
3. Paused mutations offline (`networkMode`) combined with optimistic writes, and whether to persist the mutation cache or keep the existing IndexedDB queue as the only offline path.
4. Service worker on iOS PWA: network-first with a timeout versus stale-while-revalidate for App Router RSC payloads; whether intercepting cross-origin fetches costs latency on WebKit.
5. Client-generated ids (UUIDv7) for create mutations against NestJS/Postgres, to make creates optimistic.

### Open product questions
- Routine reorder UX: drag handle or up/down buttons (the entry editor already uses up/down)?
- Headline wording and the "done" rule: done means `sets >= targetSets`, and an exercise without a target counts as done after one set?
- Creates: switch to client-generated ids to make them optimistic, or keep server ids with a pending state?

### Risks
- Rollback UX: a failed optimistic write needs visible feedback (a toast or inline error). Today there is no toast system.
- Moving the workout page onto React Query touches the offline-critical flow. It needs strong tests with the IndexedDB queue.
- Service-worker changes affect installed iPhones. Bump the cache name and keep the update path tested (the earlier pinned-build bug).
- The `routine.position` migration on existing rows needs a deterministic backfill.

### Ready for Proposal
Yes, after research and the owner's answers to the open questions.
