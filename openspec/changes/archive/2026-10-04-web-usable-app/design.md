# Design — web-usable-app

**Date**: 2026-10-04
**Inputs**:
- `proposal.md` (D1–D7)
- `research.md` (C1–C8)
- the specs `app-shell`, `routines`, `workout-logging`, `catalog`, `auth`
- the canvas https://claude.ai/artifact/4TJ4TW6rGcWBsdnjKjVsvC

## 1. Routes and layout

```
apps/web/src/app/
├── (app)/                      tab-bar screens (route group, no URL segment)
│   ├── layout.tsx              <AppShell>: header + content + <WorkoutMiniBar> + <TabBar>
│   ├── page.tsx                /            Home
│   ├── statistics/…            /statistics  Progress (moved in, unchanged)
│   ├── routines/page.tsx       /routines    segment: Routines
│   ├── routines/[routineId]/   /routines/:id  plan view
│   ├── exercises/page.tsx      /exercises   segment: Exercises
│   ├── equipment/page.tsx      /equipment   segment: Equipment
│   ├── equipment/[equipmentId]/page.tsx     detail
│   └── profile/page.tsx        /profile
├── workout/page.tsx            full screen, no tab bar (rebuilt)
├── equipment/[equipmentId]/recompute/  stays full screen
└── sign-in/
```

- The Routines tab is active on `/routines*`, `/exercises` and `/equipment*`. A `<CatalogSegments>` control links between those three routes, which matches the spec requirement "catalog lives with routines".
- `manifest.webmanifest` `start_url` becomes `/`.
- `<TabBar>` and `<AppShell>` live in `src/features/shell/presentation/`. Sheets use shadcn **Drawer** (`swipeDirection="down"`), added with `shadcn add drawer`. Research U1 still needs confirming: if the Base UI preset installs it differently, use Sheet `side="bottom"` instead. A title is always present.

## 2. API

These are additive reads plus one relaxed rule, with **no migrations**. Each endpoint sits in its owning module's `presentation/<endpoint>/` folder, following the existing convention, with use cases `@Injectable` and tokens per module.

| Endpoint | Module | Returns |
|---|---|---|
| `GET /routines` (extended) | routines | adds `lastDoneAt: string \| null` per routine and top-level `upNextRoutineId: string \| null` |
| `GET /exercises/:id/last-sets?excludingSession=<id>` | measurement | `{ sessionStartedAt, sets: [{ setNumber, mode, value, reps }] } \| null`: the sets of that exercise in its most recent session other than the open one, numbered in `logged_at` order |
| `GET /equipment/:id/usage` | catalog | `{ exercises: number, sets: number }` |
| `GET /statistics/week` (extended) | statistics | adds `trainedOn: string[]` (ISO dates of sessions started in the current week) |
| `POST /workouts/:id/finish` (extended) | workouts | optional body `{ finishedAt }`; see §3 |
| `POST /workouts/:id/sets` (relaxed) | measurement | accepts late sets; see §3 |

### Up next is a domain service

`packages/domain/src/routines/services/up-next.service.ts`:

```ts
export const upNext = (routines: readonly { id; position; archived; lastDoneAt: Date | null }[]): string | null
```

- It filters out archived routines.
- It sorts never-done routines first, then by `lastDoneAt` ascending, then by `position`.
- It returns the first routine, or `null`.
- It is pure, with one test per spec scenario.

`lastDoneAt` comes from a single grouped query: `max(started_at) group by routine_id` over the user's `workout_session` rows, using the `(user_id, started_at)` index.

## 3. Finishing and late sets (D4)

### The instant travels with the request

`FinishWorkoutUseCase` currently stamps the server's `now`. For a queued finish, that would be hours late. The request now carries the instant the user pressed Finish:

- `finishedAt` is optional and defaults to the server's `now`, so existing behaviour is unchanged.
- It must be ≥ `startedAt`. The entity already enforces this with `InvalidWorkoutTimesError`.
- It must be ≤ server `now` + 5 min of skew tolerance. A new domain error is raised beyond that.

### Late sets are accepted

In `LogSetsUseCase`, `if (session.isFinished) throw` becomes:

```ts
if (session.isFinished && input.sets.some((set) => set.loggedAt > session.finishedOn!)) {
  throw new WorkoutAlreadyFinishedError(...)
}
```

- Sets at or before the finish are accepted; a batch containing any later set is refused as a whole, so nothing is half-written.
- The UI cannot log after a local finish, so a refused batch means real clock skew beyond the finish. Because both instants now come from the same device clock, that does not happen in practice.
- Tests: before, exactly at, and after the finish instant.

### Web: finishing goes through the queue

- **A new IndexedDB store `pending-finish`.** Its key is `sessionId` and its value is `{ finishedAt }`. Adding it bumps the database version, and the upgrade only adds the store, so existing queued sets survive.
- **`FinishWorkoutOfflineUseCase`** writes the intent and marks the session as locally finished.
- **`SyncPendingSetsUseCase` grows into `SyncPendingWorkUseCase`.** It sends every queued set first, then each finish intent whose session has no sets left in the queue. A finish is never sent ahead of its own sets.
- **Display.** While a finish intent exists, the web treats that session as closed, even if `GET /workouts/current` still returns it as open. The intent is cleared once the API confirms the finish, or answers 409 because the session was already finished.

## 4. Workout screen

`apps/web/src/app/workout/page.tsx` stays the offline composition root (as in `web-api-client`). Its presentation is rebuilt:

```
features/measurement/presentation/
├── containers/workout-screen.container.tsx   wiring + state machine
├── components/workout-header.tsx              ⌄ minimise · name/timer · Finish
├── components/exercise-focus.tsx              "Exercise N of M · plan", name, set bar
├── components/last-time-card.tsx              value | none | no-set-N | offline
├── components/value-tile.tsx                  <button> showing label/value/hint
├── components/set-keypad.tsx                  chips + pad + Reps › + Log
└── components/done-sets.tsx
```

- **Keypad (D6, research C1–C3).**
  - Tiles are `<button aria-pressed>` with `aria-label="Weight per side, 22.5 kilograms"`.
  - Keys are `<button>` elements, and `Delete` has an `aria-label`.
  - A visually hidden `<p aria-live="polite">` announces the value being edited.
  - There is no `<input>`, so no keyboard can open.
  - Entry is a pure reducer, `keypad.reducer.ts`: digit / decimal / delete / step(±2.5) / sameAsLast / switchField. It is unit-tested, for example one decimal point at most, step clamped at 0, and an integer-only reps field.
- **Order and plan.** The exercise order comes from the routine's entries; an empty workout uses the order in which exercises are added. Rest uses `entry.restSeconds`, falling back to 180, and is wired through the existing `restSecondsFor` prop, which closes MVP task 10.2.
- **Last time (D5).** `useLastSets(exerciseId, sessionId)` is prefetched for every routine exercise when the screen opens online, so it survives going offline mid-session. Its states map to the card: data, none (first time), no set N, or offline (`fetchStatus === 'paused'` with no data).
- **Done sets** come from the local queue plus the synced sets of this session. The queue is the source of truth while offline.

## 5. Offline reads (W1/W2)

`lib/query-client.ts`:
- `retry` becomes `shouldRetry` with a maximum of **1**, plus a `retryDelay` of 1 s, so an error shows within about 2 s (spec: ≤ 5 s).
- A shared `<QueryState>` helper renders `isPending && fetchStatus === 'paused'` as "You're offline", `isError` as the screen's failure copy, and otherwise the content. Every rebuilt screen uses it.

## 6. Home and the start entry points

- **Home** reads `useRoutines()` (with `lastDoneAt` and `upNextRoutineId`), `useWeekComparison()` (now with `trainedOn`) and `useCurrentWorkout()`.
- **The headline** names `upNextRoutineId`. With no routines it says "Make your first routine" and links to `/routines`.
- **`RoutineStartSheet`** (Start / See the plan) and the **`StartMenu`** (+) both call one `useStartWorkout()` mutation: `startWorkout(routineId?)`, then navigate to `/workout`.
- **`RoutinePickerSheet`** starts on tap.
- **While a workout is open**, Home's routine rows render disabled with "finish the open one first", and the + button becomes the timer, linking to `/workout`.

## 7. Catalog and profile

- **Exercises.** List, plus a create sheet (name and three mode cards, each a `<label>` with a radio), rename, and archive. The API already supports all of these.
- **Equipment.** List and detail, with `useEquipmentUsage`. "Correct the bar weight…" links to `/equipment/:id/recompute`.
- **Profile.**
  - Email comes from `GET /auth/me`.
  - The pending count comes from `CountPendingSetsUseCase`.
  - Sign out calls `POST /auth/sign-out`, clears the query cache, and does a full navigation to `/sign-in`.
  - The queue is **not** cleared on sign-out: sets belong to the device's user, and they sync on the next sign-in.

## 8. Testing (strict TDD)

- **Domain:** `upNext` (5 spec scenarios), the finish skew rule, and the late-set rule.
- **API use cases:** finish with a client instant, late sets (before / at / after), last-sets numbering, usage counts, and the week `trainedOn`. Repository tests run against Postgres where the existing tests do.
- **Web:**
  - the keypad reducer
  - `SyncPendingWorkUseCase` ordering (sets before finish; finish waits for its own sets)
  - the `pending-finish` IndexedDB store, including an upgrade that keeps existing sets
  - the `QueryState` mapping
  - the API functions with the stub adapter
- **Components:** jsdom tests for `LastTimeCard` states and `SetKeypad` (it announces values and renders no `input`).
- **Device check** (manual, Ian, after the last slice): VoiceOver on the keypad, an offline finish in airplane mode, and the PWA start URL.

## 9. Slices (from the proposal; sized in tasks)

1. **Shell and finishing**:
   - API: the finish instant, late sets.
   - Web: route group, tab bar, header, Home skeleton, mini bar, the pending-finish queue and sync order, Profile and sign-out, the `QueryState` helper and retry change.
2. **Catalog**: Exercises, Equipment, the usage endpoint, the recompute link.
3. **Routines**: list, plan, entry sheet, create, reorder, rest wiring.
4. **Up next**: the domain service, `lastDoneAt` and `upNextRoutineId`, `trainedOn`, the real Home, the start sheet, the + menu and the picker.
5. **Workout screen**: last-sets endpoint, the focus layout, the keypad, the last-time card.
