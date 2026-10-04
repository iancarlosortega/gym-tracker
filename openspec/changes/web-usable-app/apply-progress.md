# Apply progress — web-usable-app

Mode: Strict TDD. Delivery: auto-chain; each review unit is a slice that Ian reviews locally and that is then committed directly to `main` (no PRs).

## Committed units

| Unit | Commit | Notes |
|------|--------|-------|
| planning | 275adba | proposal, specs, design, tasks |
| 1a — API finish instant and late sets | 2242f27 | |
| 1b — shell, navigation, query states | 8e4a837 | 1b.3 (drawer) moved to 2a |
| 1c — finish through the queue, mini bar | 21dc9e2 | 832 lines against a 390 estimate; reviewed locally by Ian |

### 1c summary

- Queue: `openGymDatabase` v2 (pending-sets plus pending-finish), `IndexedDbPendingFinishStore`, `finishWorkout` (409 counts as delivered), `FinishWorkoutOfflineUseCase`, and `SyncPendingWorkUseCase`, which composes `SyncPendingSetsUseCase` instead of renaming it (a deviation).
- UI: the `openWorkout` rule, `offlineWork()` singletons, `useOpenWorkout` and `useFinishWorkout`, `WorkoutMiniBar`, the timer tab slot, `AppShellContainer` background sync, and the Finish button on the workout page.
- Gap: the mini bar has no routine name or set count yet (3a/4b).

## Unit 5c — the focus workout screen (committed, under Ian's standing go-ahead)

All implementation tasks are done. Only the manual device checks DV-U1 to DV-U4 remain, and they are Ian's.

- **Addition, API (e07de2d):** `GET /workouts/:id/sets` (`ListSessionSetsUseCase`, which checks ownership through `findOwnedWorkout`). The design's "done sets = queue + synced sets of this session" had no endpoint to read the synced half. Without it, minimizing and resuming a workout would empty the done list and reset "Log set N".
- [x] 5c.1 (34dab74, lint fix fed2f34):
  - `LastTimeCard` covers value / no set N / first time / offline / loading, at a fixed height.
  - `workout-plan.ts` adds `compatibleEquipment` (mirrors `Equipment.supports`), `defaultEquipmentId` (plan → used earlier this workout → the only fit → ask), `workoutOrder` (routine order, then added exercises) and `lastTimeState`.
- [x] 5c.2 (1bcad95 components + this commit).
  - Components: `WorkoutHeader` ("Push day · 32:10", minimize, Finish), `ExerciseFocus` ("Exercise N of M · plan", name, progressbar, equipment chip), `DoneSets` (with "waiting to sync"), `LogRow` (‹ Log set N ›).
  - Done sets: `done-sets.ts` merges server and queue (the queue wins while a set is pending) and numbers sets per exercise by `loggedAt`.
  - `WorkoutScreenContainer`:
    - The keypad opens only from a tile.
    - Logging goes through `LogSetOfflineUseCase`; the rest timer uses `restSecondsFor` and the push alert as before.
    - There is an equipment picker drawer and an "Add an exercise" drawer (for empty workouts and extras).
    - While typing, last time moves into the tile hint.
- [x] 5c.3 Removed `LogWorkoutContainer`, `SetEntryForm` (+ test) and `LoggedSetList`; nothing references them.
- **Equipment (flagged):** the chosen design has no place to pick equipment, yet every set needs it, and routine entries rarely name one. The chip and picker with a smart default keep logging possible. Ian should confirm the default order on device.
- **Deferred:** the Home headline for an open workout ("Push day, 3 of 5 done"). It could now be derived from the session's sets, and is left as a follow-up.

### Evidence

| Evidence | Value |
|----------|-------|
| RED → GREEN | session sets use case 2 (order, other user); workout-plan 11; last-time card 5; components 7; done-sets 5; session-sets client 1 |
| API | 33 files, 239 tests; typecheck clean |
| Web | 55 files, 333 tests; typecheck clean; biome clean; `next build` OK |
| Runtime harness | not run in a browser: the full flow (log offline, rest, minimize/resume) is DV-U2/U3/U4 |
| Mistake | 1bcad95 was committed while biome reported errors in 34dab74's file (the output was swallowed by a chained command). This was fixed in fed2f34 |

## Unit 5b — the keypad (committed 0c33c34)

- [x] 5b.1 `presentation/keypad/keypad.reducer.ts`:
  - digit, decimal (at most one, "0." when first, ignored for reps), delete, step (weight ±2.5, reps ±1, clamped at 0), sameAsLast (fills both values) and switchField.
  - The first key after opening a field replaces its value.
  - `keypadValues` reads an empty or unfinished value ("22.") as null.
- [x] 5b.2 `ValueTile` and `SetKeypad`.
  - `ValueTile` is a `<button aria-pressed>` labelled "Weight per side, 22.5 kilograms" (or "not entered").
  - `SetKeypad` has −/Same as last/+ chips, 60px keys, "Decimal point" and "Delete" labels, Reps ›/‹ Weight, a tall "Log set N", and Close. A `role="status"` live region announces "<Field> <value>".
  - It renders no input or textarea.

### Evidence

| Evidence | Value |
|----------|-------|
| RED → GREEN | reducer 10 (decimal rules, integer reps, delete, step clamp, same as last, switch, unfinished value); components 7 (tile labels, no input, the 2-2-.5 → "22.5" announcement, chips + switch, no last, log/close) |
| Web | 51 files, 310 tests; typecheck clean; biome clean |
| Device | VoiceOver behaviour stays DV-U3 |

Size: 444 lines (about 170 tests). One commit.

## Unit 5a — the last-sets endpoint (committed 4ba7b70, ff4b9b7)

- [x] 5a.1 `GET /exercises/:id/last-sets?excludingSession=` returns `{ sessionStartedAt, sets: [{ setNumber, mode, value, reps }] } | null`.
  - Domain port: `LastSetsRepository`.
  - `GetLastSetsUseCase` numbers the sets by logged order, and gives the value as entered: total kg, kg per side, or pin position.
  - `DrizzleLastSetsRepository` finds the user's most recent other session with a live set of the exercise, then reads its sets in `logged_at` order.
  - The DTO accepts any UUID version.
- [x] 5a.2 Web: `getLastSets` treats an empty body as null (Nest sends no body for a null return). `useLastSets` has infinite staleTime. `prefetchLastSets` reads each planned exercise once, only while online, and is triggered on the workout page when the routine loads.

### Evidence

| Evidence | Value |
|----------|-------|
| RED → GREEN | use case 3, PGlite repository 4 (order, exclusion, none, other user), DTO 3, web client 3, prefetch 2 |
| API | 32 files, 237 tests; typecheck clean |
| Web | 49 files, 293 tests; typecheck clean; `next build` OK |
| Fixture fix | a stack set must not carry a bar weight in its snapshot (the domain refused it, correctly) |

Size: 572 lines (421 API + domain, 149 web). Committed as two commits: API, then web.

## Unit 4b — up next: Home and the start entry points (committed 7767527, 51a1f3d)

- [x] 4b.1 Home (`features/home`).
  - `HomeHeadline` reads "<Routine> is up next." plus `lastDoneLabel` (today / yesterday / weekday / "21 Sep"; month names spelled out, because Intl gives "Sept" on this runtime). With no routines it reads "Make your first routine" and links to /routines.
  - `WeekStrip` shows Mon–Sun, filled from `trainedOn`.
  - The existing `WeekHeadline` serves as the stat cards.
  - `HomeRoutineList` shows "last done" and an Up next tag.
- [x] 4b.2 `RoutineStartChoices` (Start / See the plan) opens in a drawer from a Home row. While a workout is open, rows are disabled with "Finish the open one first."
- [x] 4b.3 The + in the TabBar is now a button (`onStart`) that opens `StartMenu`: Start <up next> starts directly, plus "Pick a different routine" and "Empty workout". `RoutinePicker` ("Start which routine?") puts up next first, tagged, and starts on tap. With a workout open, + stays the timer link back to /workout. Both are hosted in `AppShellContainer`.
- [x] 4b.4 `UpNextTag` on the Routines list cards.
- **Contract change:** the web `getRoutines()` now returns `{ routines, upNextRoutineId }` (with `lastDoneAt`), and `WeekComparisonResponse` gains `trainedOn`. `startOfWeek` moved to `statistics/presentation/week-start.ts`.
- **Gap (flagged):** the canvas headline for an open workout ("Push day, 3 of 5 done. Next up: …") is not built. It needs per-session set progress, which fits 5c. Home rows already block a second start.
- The old tab-bar test ("+ is a link to /workout") was replaced, because + is now the start menu by design.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 4b.1 | module missing | 6/9, then 9/9 | 5 last-done shapes ("Sept" caught → fixed month list); headline with/without; strip | none |
| 4b.1 list | module missing | 3/3 | tag + labels, pick, workout open | none |
| 4b.2/4b.3 sheets | module missing | 4/4 | start/plan; menu 3 actions; no routines; picker order + tap | none |
| 4b.3 tab bar | button missing | 2/2 | closed → button, open → link | superseded link test removed |
| 4b.4 | tag missing | 1/1 | tagged vs untagged | none |
| listing client | shape mismatch | 1/1 | items + upNext | none |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Web suite | 47 files, 288 tests passed (272 before); typecheck clean; `next build` OK |
| Lint | biome clean (`--write` touched only 4b files) |
| Runtime harness | N/A: no browser e2e. Home and the + menu are device verification (DV) |
| Rollback boundary | features/home, start-sheets, the tab-bar + button, app-shell start sheets, the routines listing client, statistics `trainedOn` type, and week-start |

Size: 682 added lines, 73 removed (203 tests), against a forecast of about 380. **This is over the 400 budget.** Proposed commits: the views and sheets with their tests, then the wiring (shell, home page, listing client).

## Unit 4a — up next: domain and API (committed 4c94bf8)

- [x] 4a.1 `packages/domain/src/routines/services/up-next.service.ts`: the pure `upNext()` filters archived routines, puts never-done ones first (sorted as −∞), then oldest `lastDoneAt`, then position. There is one test per spec scenario (5).
- [x] 4a.2 `GET /routines` adds `lastDoneAt` per item and a top-level `upNextRoutineId`.
  - Domain port: `RoutineHistoryRepository.lastDoneAt(userId)`.
  - `DrizzleRoutineHistoryRepository` does `max(started_at) group by routine_id`, for this user only, skipping empty workouts.
  - `ListRoutinesUseCase` returns `{ page, lastDoneAt, upNextRoutineId }`; `toRoutineListView` builds the response.
- [x] 4a.3 `GET /statistics/week` adds `trainedOn`: the distinct ISO dates of this week's workouts, sorted. A new PGlite test pins that `sessionsInPeriod` returns only this user's workouts in the period.
- **Design gap (flagged):** routines have no position of their own; only their entries do, and the list is sorted by name. The tie-break "routine order" is therefore the order the list shows, which is name order. A real user-defined routine order would need a migration and a reorder UI, so that is left as a follow-up decision.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 4a.1 | module missing | 5/5 | the 5 spec scenarios (ties checked both never-done and same-date) | none |
| 4a.2 use case | the new listing shape failed | 4/4 | last done, oldest wins, a never-done tie in list order, none | none |
| 4a.2 repository (PGlite) | module missing | 3/3 | latest of two, empty workouts and never followed, another user | none |
| 4a.3 | `trainedOn` undefined | 2/2 | dedup + sort + only this week; empty week | none |
| 4a.3 sessions scope (PGlite) | characterization (already true) | 1/1 | own vs another user's, in vs out of the week | none |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Domain | 210 tests passed, typecheck clean, rebuilt `dist` |
| API | 29 files, 227 tests passed, typecheck clean |
| Lint | biome clean |
| Runtime harness | the repository runs against PGlite; the web consumes this in 4b |
| Rollback boundary | the domain up-next service and history port; the API routines listing/history/view and statistics `trainedOn` |

Size: 364 added lines (210 tests), within the 400 budget.

## Unit 3b — routine editing and rest (committed 2fbb68b fix, 2a55eea feature)

- **API bug fixed (found during 3b.3):** `ReorderRoutineDto` validated `@IsUUID('4')`, but every id is a UUIDv7, so every real reorder was refused with a 400. It is now `@IsUUID('all')`, covered by a new DTO test (red on v7 ids, then green).
- [x] 3b.1 `routines.api.ts`: `addRoutineExercise`, `changeRoutineEntry` (PATCH), `removeRoutineEntry` (DELETE) and `reorderRoutine` (PUT `/order`, the full list of ids).
- [x] 3b.2 `EntryEditor`: a 56 px sets stepper (min 1, max 50), From/To reps, rest chips (1:00, 1:30, 2:00, 3:00, 4:00, plus the current value if it is custom), Save, and "Remove from routine". Reps are validated with the domain's `TargetReps.create` inside zod `superRefine`, so the form shows the domain's own message.
- [x] 3b.3 `RoutineEditor`: an edit mode in the plan, with large up/down buttons (the pure `moved()` builds the full order), tapping an entry to open `EntryEditor` in a drawer, "Add an exercise" from the catalog (archived ones are never offered), "Rename or archive", and Done.
- [x] 3b.4 `restSecondsFor(entries | null)(exerciseId)` falls back to `FALLBACK_REST_SECONDS = 180`. The workout page reads the open session's routine and passes it as the `restSecondsFor` prop; if that read fails while offline, the fallback is used. This closes MVP task 10.2.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| reorder DTO | v7 ids refused (1 of 3 failing) | 3/3 | v7 accepted; non-uuid and empty refused | none |
| 3b.1 | missing exports | 4/4 | add, change, remove, reorder | none |
| 3b.2 | module missing | 5/5 | full edit, initial values, min sets, domain range error, remove | `onSave` type tightened |
| 3b.3 | module missing | 6/6 | moved up/down/edges; reorder, edit, add (no archived), done | none |
| 3b.4 | module missing | 3/3 | planned, outside the routine, empty workout | none |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Web suite | 45 files, 272 tests passed (254 before); typecheck clean; `next build` OK |
| API suite | 27 files, 218 tests passed; typecheck clean |
| Lint | biome clean |
| Runtime harness | N/A: no browser e2e. The rest countdown with a routine is device verification (DV) |
| Rollback boundary | API reorder DTO (+test); web routines api/editor/entry-editor/rest-seconds-for/queries/container; workout page rest wiring |

Size: 793 added lines (274 tests, 25 API), against a forecast of about 380 for 3b. **This is over the 400 budget.** Proposed commits: `fix(api)` reorder ids, then the web editing feature.

## Unit 3a — routines list and plan (committed 4b3b36b, 1d45b15)

- [x] 3a.1 `routines/infrastructure/routines.api.ts`: list (`/routines?limit=200`), get, create, rename (PATCH) and archive (POST `:id/archive`).
- [x] 3a.2 `/routines`: `RoutineCards` (name, exercise names in plan order, exercise count, archived hidden), "New routine" opening a `NewRoutineForm` drawer (navigates to the new plan), and an empty state with "Make your first routine". The catalog segments are on top.
- [x] 3a.3 `/routines/[routineId]`: `RoutinePlan` lists the entries numbered in position order as "4 × 6–8 · rest 3:00", with "Start <routine>" through the new `useStartWorkout()`, which then navigates to `/workout`. A failure shows an alert ("Finish the open workout first…").
- **Deviation:** "Edit" currently opens rename/archive (reusing `EditCatalogItemForm`). The full edit mode (reorder, add an exercise) is task 3b.3.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 3a.1 | module missing | 6/6 | list, get, 404, create, rename, archive | none |
| 3a.2/3a.3 views | module missing | 14/14 | rest 3:00/1:30/0:45; 4 target shapes; archived/empty; order; start/fail/edit | none |
| 3a.2 form | module missing | 3/3 | trimmed name, blank, failure | none |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Web suite | 42 files, 254 tests passed (231 before) |
| Typecheck / lint / build | clean / clean / `next build` OK (`/routines`, `/routines/[routineId]`) |
| Runtime harness | N/A: no browser e2e; start → /workout is checked manually |
| Rollback boundary | features/routines/**, `(app)/routines/**`, and `useStartWorkout` in workouts queries |

Size: 705 added lines (232 tests, about 470 code + openspec), against a 260 forecast. **This is over the 400 budget.** Proposed commits: the API client + views (with tests), then the containers + pages.

**Ledger note:** 2b's attempt was settled by mistake by a probe call. Its evidence revision is recorded as all zeros with the diagnosis "probe". The real evidence for 2b is in the 2b section below.

## Unit 2b — equipment and the usage endpoint (committed 2fcfff1 api, 7929dd5 web)

- [x] 2b.1 API `GET /equipment/:id/usage` returns `{ exercises, sets }`.
  - Domain port: `EquipmentUsageRepository`.
  - `GetEquipmentUsageUseCase` checks ownership through `findOwnedEquipment` before it counts anything.
  - `DrizzleEquipmentUsageRepository` runs `countDistinct(exercise_id)` and `count(id)`, joining through `workout_session` for the owner and leaving out deleted sets.
- [x] 2b.2 Web `/equipment`: a list (bar N kg / stack · N positions / free weight) with archived items hidden.
  - `/equipment/[id]` shows the bar weight with "Correct the bar weight…" linking to the existing recompute route (barbells only), the stack size, a usage line, and "Rename or archive", which opens a Drawer.
  - The drawer reuses the shared form, renamed from `EditExerciseForm` to `EditCatalogItemForm`.
  - `useExerciseMutation` was generalized to `useCatalogMutation`; equipment writes invalidate the catalog and workouts equipment keys.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 2b.1 use case | module missing | 2/2 | owner vs stranger (usage never read) | none |
| 2b.1 repository (PGlite) | module missing | 4/4 | distinct exercises vs sets; zero; deleted; another user | none |
| 2b.2 api | module missing | 5/5 | usage, a 500, rename, archive | none |
| 2b.2 views | module missing | 13/13 | 3 summaries, 3 usage labels, list/empty, bar vs stack | shared edit form renamed; mutation helper generalized |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| API suite | 26 files, 215 tests passed; typecheck clean (after rebuilding `@gym/domain` so the new port is exported) |
| Domain suite | 205 passed |
| Web suite | 39 files, 231 tests passed; typecheck clean; `next build` OK (`/equipment`, `/equipment/[equipmentId]`) |
| Lint | biome clean on all touched paths |
| Runtime harness | the repository runs against PGlite (real Postgres); the endpoint has no supertest test (the existing equipment controllers have none either) |
| Rollback boundary | API: catalog usage port, use case, repository and controller, plus module wiring. Web: catalog equipment api/views/container/queries and `(app)/equipment` routes |

Size: 749 added lines (265 API + domain, about 484 web + openspec), against a 300 forecast. **This is over the 400 budget.** Two commits are proposed: the API endpoint, then the web screens.

## Unit 2a — exercises catalog (committed c07a984 drawer, ff5ce8b feature)

- [x] 1b.3 Drawer: the base-nova preset installs the Base UI drawer (`@base-ui/react/drawer`, `swipeDirection="down"`). Research U1 is resolved and no Sheet fallback is needed. The file is vendored by the shadcn CLI and only reformatted by biome.
- [x] 2a.1 `catalog/infrastructure/exercises.api.ts`: `getCatalogExercises` (includes archived), `createExercise`, `renameExercise` (PATCH) and `archiveExercise` (POST `:id/archive`).
- [x] 2a.2 `CatalogSegments`: links to Routines, Exercises and Equipment, with `aria-current` taken from the pathname.
- [x] 2a.3 `/exercises`: `ExerciseList` with mode chips (total / per side / pin position), "Show archived (N)", and an empty state with "Add your first exercise".
- [x] 2a.4 `NewExerciseForm` (a name plus three radio cards inside labels, RHF + zod) and `EditExerciseForm` (rename, plus Archive with the note "Old sets stay in your history."), both inside a Drawer opened from the list. Mutations invalidate `catalogKeys.exercises()` and `workoutsKeys.exercises()`.

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 2a.1 | module missing | 5/5 | list, create, a 400 refusal, rename, archive | none |
| 2a.2 | module missing | 7/7 | 5 pathnames; active vs inactive | none |
| 2a.3 | module missing | 5/5 | modes, archived toggle, no archived, empty, edit | `modeLabel` became a switch (biome naming) |
| 2a.4 | module missing | 5/6, then 6/6 | create, blank name, failure, rename, archive | the submit passed the event (fixed in impl); `NameField` became generic, with no `any` |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Full web suite | 37 files, 214 tests passed (191 before) |
| Typecheck | clean |
| Lint | biome clean |
| Build | `next build` compiled; `/exercises` and `/profile` were prerendered |
| Runtime harness | N/A: there is no browser e2e harness; the drawer is checked manually |
| Rollback boundary | features/catalog/**, app/(app)/exercises, components/ui/drawer.tsx |

Size: 960 new lines. That breaks down as 208 for the vendored drawer, 251 for tests and about 500 for code. **This is over the 400 budget.** Two commits are proposed: the drawer vendor chore, then the exercises feature.

## Unit 1d — profile and sign-out (committed 8f184fe)

- [x] 1d.1 `auth.api.ts`: `getMe()` (`GET /auth/me`) and `signOut()` (`POST /auth/sign-out`). A 401 on sign-out settles without a redirect.
- [x] 1d.2 `/profile`: the email, a pending-set count, the existing `PocketedAlertsContainer` as the rest-alert state, and a tinted `destructive` Sign out button with a `LogOut` icon.
- [x] 1d.3 `SignOutUseCase`: end the session, then clear the query cache, then do a full navigation to `/sign-in`. If the server cannot be reached, nothing is cleared and the user stays on the page. The offline queue is never touched.

### Files

| File | Action |
|------|--------|
| apps/web/src/features/auth/infrastructure/auth.api.ts (+test) | Created |
| apps/web/src/features/auth/application/sign-out.use-case.ts (+test) | Created |
| apps/web/src/features/auth/presentation/components/profile-details.tsx (+test) | Created |
| apps/web/src/features/auth/presentation/containers/profile.container.tsx | Created |
| apps/web/src/features/auth/presentation/queries.ts | Created |
| apps/web/src/app/(app)/profile/page.tsx | Created |
| apps/web/src/features/workouts/presentation/offline-work.ts | Modified: `countPendingSets` |
| apps/web/src/features/workouts/presentation/queries.ts | Modified: `usePendingSetCount` (networkMode 'always') |

### TDD cycle evidence

| Task | RED | GREEN | Triangulate | Refactor |
|------|-----|-------|-------------|----------|
| 1d.1 | auth.api.test.ts failed: module missing | 5/5 | 200 vs 500; 204 vs 401 vs 503 | none needed |
| 1d.3 | sign-out.use-case.test.ts failed: module missing | 2/2 | success order vs server failure | none needed |
| 1d.2 | profile-details.test.tsx failed: module missing | 7/7 | label for 0, 1 and 4 sets; idle, busy and failed | biome import order |

### Work unit evidence

| Evidence | Value |
|----------|-------|
| Focused tests | `pnpm vitest run` on the three new test files: 14/14 passed |
| Full web suite | `pnpm vitest run`: 33 files, 191 tests passed (baseline 177) |
| Typecheck | `pnpm typecheck`: clean |
| Lint | `biome check` on the touched paths: clean after `--write` (import order) |
| Runtime harness | N/A here: the sign-out and profile flow is manual (DV after 5c); the container is composition only |
| Rollback boundary | The files listed above; reverting them removes /profile and sign-out without affecting 1a–1c |

Size: about 364 changed lines (forecast about 170), within the 400 budget.

### Deviations

- `auth.api.ts` lives in `features/auth/infrastructure` as plain functions, matching `workouts.api.ts`. The existing `HttpSignInGateway` class was left as it is.
- The pending count shows sets only (the spec wording), not queued finishes.

## Remaining

2a, 2b, 3a, 3b, 4a, 4b, 5a, 5b, 5c, then device verification (DV-U1 to DV-U4).
