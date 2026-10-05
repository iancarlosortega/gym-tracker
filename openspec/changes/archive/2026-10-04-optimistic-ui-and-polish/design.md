# Design — optimistic-ui-and-polish

Inputs: proposal.md, specs/{responsive-ui,routines,app-shell,display-unit}, research.md (R1–R8), exploration.md.

## D1. One optimistic-mutation helper, cache shape (R1, R2, R7)

`apps/web/src/lib/optimistic.ts` exports `optimisticMutation<TVars, TResult>(options)`. It returns `UseMutationOptions` and is used by each feature's `queries.ts`. The options are:

```ts
{
  mutationKey: readonly unknown[]       // also the isMutating filter
  scope?: string                        // serialises same-target writes
  mutationFn: (vars: TVars) => Promise<TResult>
  patches: (vars: TVars) => readonly CachePatch[]   // { queryKey, update(old) => new }
  invalidates: readonly (readonly unknown[])[]      // on settle
}
```

- **onMutate:** for every patch, `await cancelQueries({queryKey})`, take a snapshot with `getQueryData`, then `setQueryData(queryKey, update)`. It returns `{ snapshots }`.
- **onError:** restores the snapshots, in reverse order, only when `isMutating({mutationKey}) === 1`. Otherwise it leaves restoring to the final invalidate, because a rollback from an earlier snapshot would erase later optimistic edits (R2 C6).
- **onSettled:** when `isMutating({mutationKey}) === 1`, it returns `Promise.all(invalidates.map(invalidateQueries))`. The mutation stays pending until the refetch lands, so there is no flicker (C4).
- **scope:** `scope: { id }` serialises writes that depend on order (C5).

Scopes:
- `display-unit`.
- `routine-entries:<routineId>`.
- `routine-order`.
- `catalog:<kind>:<id>`.

**Rollback message.** `useRollbackNotice(mutation)` turns `mutation.isError` plus `mutation.variables` into `{ message, retry }`. `retry` calls `mutation.mutate(variables)` again. Containers render it inline next to the item through a presentational `<RollbackNotice>` atom: `role="status"`, "Not saved.", and a Try again button.

There is no global toast. The UI side effects stay in components, per R7 (C15, C16).

**Rejected alternatives:**
- The `variables`-only pattern for shared keys, because the unit is read app-wide.
- `useOptimistic` (R4).
- A persisted mutation cache (R3).

## D2. Which mutations

| Mutation | Patches | Scope | Invalidates |
|---|---|---|---|
| display unit | `authKeys.me()` → `{...me, displayUnit}` | `display-unit` | `authKeys.me()` |
| routine rename / archive | `routinesKeys.list()` (rename or filter out), `routinesKeys.detail(id)` | `routine:<id>` | `routinesKeys.all` |
| entry change / remove / reorder | `routinesKeys.detail(id)` entries | `routine-entries:<id>` | `routinesKeys.detail(id)`, `routinesKeys.list()` |
| routine order | `routinesKeys.list()` reordered | `routine-order` | `routinesKeys.list()` |
| exercise / equipment rename / archive | `catalogKeys.*` list | `catalog:<kind>:<id>` | `catalogKeys.*`, `workoutsKeys.exercises/equipment` |

The up/down buttons in `routine-editor.tsx` stop using `disabled={pending}`.

Creates stay `await → invalidate`, with `isPending` shown on the submit and a double submit blocked. Recompute, bar-weight correction, sign-in/out and push are unchanged.

Offline, the default `networkMode: 'online'` pauses these mutations with the optimistic state applied (R3 C7). That is acceptable. Containers show the existing offline notice while `mutation.isPaused`.

## D3. Start workout navigates first

`useStartWorkout` stays a server-id mutation. The callers (`app-shell`, `home`, `routines` drawers) do the following:
1. Call `start.mutate(routineId)`.
2. Then call `router.push('/workout')` straight away, instead of in `onSuccess`.

The workout page reads the pending start through `useMutationState({ filters: { mutationKey: workoutsKeys.start(), status: 'pending' } })`:
- While it is pending, the page shows the starting state: the routine name from `routinesKeys.list()` and a skeleton.
- On error, it shows "Could not start it", Try again, and nothing else.

The raw `startWorkout()` on the empty workout page is replaced with the same mutation.

## D4. The open session moves into the Query cache

Two new query options in `workouts/presentation/queries.ts`:
- `sessionQuery()` (`workoutsKeys.current()`).
- `sessionSetsQuery(sessionId)` (`workoutsKeys.sessionSets(id)`). Its `networkMode` is `'always'`, and its `queryFn` merges the server's `getSessionSets` with the IndexedDB queue through the existing `mergeDone`. If the server fails offline, it falls back to queue-only rows.

The inline literal keys become factory entries.

`workout-page.container.tsx` switches to `useQuery`/`useQueries` for the session, the routine (`routinesKeys.detail`), exercises and equipment. Its `useState` loaders are deleted.

`workout-screen.container.tsx` keeps the IndexedDB queue as the source of truth for logging:
- After a log, it writes the optimistic row into the `sessionSetsQuery` cache with `setQueryData`, replacing the local `setDone`.
- `drain()` then invalidates the cache.

Tests port the existing container test first and keep its assertions.

## D5. Home headline

There is a pure function in `home/presentation/session-progress.ts`:

```ts
sessionProgress(entries: PlannedEntry[], done: DoneSet[]): { done: number; planned: number }
```

An exercise counts as done when its logged count reaches `targetSets`, or 1 when `targetSets` is null. Exercises outside the plan are ignored.

`HomeContainer` reads the following:
- `useOpenWorkout()`.
- The routine from `useRoutines()` list entries. If the list lacks entries, it uses `routinesKeys.detail`.
- `sessionSetsQuery`.

`HomeHeadline` gains an `open` variant:
- "{routine}, {done} of {planned} done", as a link to `/workout`.
- "Workout in progress" when there is no routine.

## D6. Routine order, bottom-up

**Domain** (`packages/domain/src/routines`):
- The routine entity gets a `position` (an integer, 0-based).
- `RoutineSortField` gains `'position'`.
- A new pure rule `reorderRoutines(current: Routine[], orderedIds: string[])` rejects a list that is not exactly the user's active ids (`RoutineOrderMismatchError`, which is a `DomainError` with an `errorCode`), and returns the routines with their new positions.
- The `upNext` input already carries `position`.

**DB:** migration `apps/api/drizzle/0002_routine_position.sql`:

```sql
ALTER TABLE routine ADD COLUMN position integer;
UPDATE routine r SET position = o.rn - 1
  FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name, id) AS rn FROM routine) o
  WHERE r.id = o.id;
ALTER TABLE routine ALTER COLUMN position SET NOT NULL;
```

The Drizzle schema gets `position: integer('position').notNull()`. The down step drops the column.

**API:**
- `CreateRoutineUseCase` sets position to `max(position)+1` for the user, or 0 if there is none.
- `ListRoutinesUseCase` orders by `position`, and up-next uses the real `position`.
- New `ReorderRoutinesUseCase` and `PUT /routines/order` with the body `{ routineIds: string[] }`, validated by a zod/class-validator DTO in the module's style. It does one transaction of updates and returns 204. An id mismatch returns 409 through `routines.http-errors.ts`.
- `routine.view.ts` exposes `position`.

**Web:**
- `reorderRoutines(ids)` in `routines.api.ts`.
- An optimistic `useReorderRoutines` (D2).
- `RoutineCards` becomes sortable with `@dnd-kit/core` and `@dnd-kit/sortable`. Sensors:
  - `PointerSensor`, with `activationConstraint: { delay: 250, tolerance: 5 }` for touch and `{ distance: 5 }` for mouse.
  - `KeyboardSensor` with `sortableKeyboardCoordinates`.
  - Announcements naming the routine.
- The drag starts only from a grip handle, which has `touch-action: none`, `user-select: none` and `-webkit-touch-callout: none`. The rest of the row scrolls and opens as it does today.
- Each row has a "More" menu with Move up and Move down, using the same mutation.
- Home and the start sheet already render in API order. The start sheet still puts up-next first.

**Verification:** the iOS long-press behaviour is unconfirmed (R8 U8.1), so a device check is planned. Move up and Move down keep the feature usable if it fails.

## D7. Units in Progress and Recompute

The conversion happens in containers, and presentational components receive display values and a unit:
- `exercise-progression.container.tsx` reads `useDisplayUnit()`. It maps each weight-series point with `kilogramsToDisplay(value, unit)` (reps series untouched) and passes `unit` to `ProgressionChart`. The chart puts the unit in its aria-label and caption, and the weekly list uses `unitLabel(unit)`.
- `recompute.container.tsx` reads the unit and passes it to `RecomputeConsequences`. That component formats both sides of records and set changes with the unit, which fixes the missing unit on the `from` side.

## D8. Service worker v4 (R5)

- Bump the cache to `gym-shell-v4`. `activate` already deletes the other caches, so the old cache is discarded.
- In `activate`, enable navigation preload: `self.registration.navigationPreload?.enable()`.
- In `fetch`:
  - Non-GET requests: return, as today.
  - **Cross-origin: return.** The SW does not handle them, so API reads bypass it.
  - Hashed asset: cache-first.
  - Everything else (same-origin navigations and `?_rsc=`): `networkFirstWithTimeout(event, 3000)`.
- `networkFirstWithTimeout` works like this:
  - It races `event.preloadResponse ?? fetch(request)` against a 3 s timer that resolves to the cached copy.
  - If the timer wins and a cached copy exists, it serves the cache and lets the network finish, using `event.waitUntil` to `cache.put` it.
  - If no copy exists, it keeps waiting for the network. A network failure falls back to the cache, as today.
- `sw.test.ts` gains:
  - Cross-origin is not handled.
  - A slow network serves the cache after the timeout and updates it later.
  - With no cache, it waits for the network.
  - Preload is used when present.
  - v3 is deleted on activate.

The 3 s timeout is a tunable constant.

## D9. Slicing (delivery: auto-chain, commits to main after Ian's review)

1. **S1 Optimistic core:** the D1 helper, `RollbackNotice`, the optimistic unit switch, and their tests.
2. **S2 Optimistic routines + catalog:** D2 rows 2, 3 and 5.
3. **S3 Service worker v4:** D8.
4. **S4 Session in the Query cache + start navigates first:** D3 and D4.
5. **S5 Home headline:** D5.
6. **S6 Routine order, domain + API + migration:** D6, backend part.
7. **S7 Routine order, web drag + move:** D6, web part, including the optimistic reorder.
8. **S8 Units in Progress + Recompute:** D7.

All slices run in Strict TDD, using vitest for web, domain and API, and the existing SQL/table tests for the migration.

## Risks carried

- The iOS long-press, service-worker timing and paused-offline behaviours need device checks. They go in tasks as DV items.
- The `isMutating === 1` guard depends on every mutation sharing the `mutationKey` passed to the helper. The helper's tests enforce this.
