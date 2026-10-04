# Tasks — web-usable-app

**Inputs**: `specs/*/spec.md`, `design.md`
**Mode**: strict TDD. Every behavioural task starts with a failing test.
**Delivery**: one review unit per sub-slice. The agent stops for Ian's local review before each commit. Nothing is pushed until he says so.
**Checks per unit**: `pnpm test`, `pnpm typecheck`, `pnpm lint`; `next build` for web units.
**Note**: routes are written without a leading slash (for example, app route "profile"), so the SDD status parser does not read them as filesystem paths.

## 1a — API: finish instant and late sets

- [x] 1a.1 Domain: test that `WorkoutSession.finishedAt(instant)` refuses an instant before the start; that rule exists already. Add the skew rule as an application-level check: an instant more than 5 min after the server's now is refused with a new `FinishedInFutureError` (`WORKOUT_FINISHED_IN_FUTURE` → 400).
- [x] 1a.2 `FinishWorkoutUseCase` takes an optional `finishedAt`, defaulting to now. Tests: default, a client instant, too far in the future, before the start.
- [x] 1a.3 Finish endpoint: an optional body DTO `{ finishedAt?: ISO string }`. Done as a class-validator DTO, following the API convention (`StartWorkoutDto`), with a DTO test and a supertest controller test; the body may be absent.
- [x] 1a.4 `LogSetsUseCase` late-set rule. Tests: a finished session accepts a set logged before the finish, accepts one logged exactly at it, and refuses a batch containing a set logged after it (nothing written).

## 1b — Web: shell, navigation, query states

- [x] 1b.1 `lib/query-client.ts`: `retry` max 1, `retryDelay` 1000. Update the `shouldRetry` tests.
- [x] 1b.2 `components/query-state.tsx`, a shared helper, with jsdom tests for paused → "You're offline", error → the failure slot, and success → children.
- [x] 1b.3 (moved to 2a, the first unit with a sheet; nothing in 1b uses it) shadcn: add `drawer` (resolves research U1); fall back to `sheet` with `side="bottom"`. Record which one was used. **Used: Drawer** — the base-nova preset installs the Base UI drawer (`@base-ui/react/drawer`, `swipeDirection="down"`); no Sheet fallback needed.
- [x] 1b.4 `features/shell/presentation`: `TabBar` (5 slots; the active state comes from the pathname, and the Routines tab covers routines, exercises and equipment) and `AppHeader` (logo plus a visual-only menu button with an `aria-label`). Tests: the active tab per pathname, and the labels.
- [x] 1b.5 The `(app)` route group and its layout. Move statistics into it. App route "" (root) becomes a Home skeleton with a "Start a workout" link to the workout route and the existing statistics summary. Set the manifest `start_url` to the root.
- [x] 1b.6 Statistics and recompute screens use `QueryState`. This closes W1/W2 on existing screens.

## 1c — Web: finishing through the queue and the mini bar

- [x] 1c.1 IndexedDB: a `pending-finish` store, with a version bump. Test that the upgrade keeps queued sets, and that put, get and delete work by session.
- [x] 1c.2 `finish.api.ts`: `finishWorkout(sessionId, finishedAt)` with a stub-adapter test. A 409 already-finished answer counts as delivered.
- [x] 1c.3 `FinishWorkoutOfflineUseCase` records the intent with the device instant. Tested.
- [x] 1c.4 `SyncPendingWorkUseCase` composes the existing `SyncPendingSetsUseCase` (no rename, less churn) and adds the finish step. Tests: sets go before the finish; a finish waits while its own session still has queued sets; a finish with no queued sets is sent; a failure keeps everything pending.
- [x] 1c.5 `useCurrentWorkout()` treats a session with a local finish intent as closed. Tested.
- [x] 1c.6 `WorkoutMiniBar` (routine name, elapsed time, set count, Resume, Finish) shown in the `(app)` layout while a workout is open. The center tab slot becomes the timer. Finish runs the offline use case.
- [x] 1c.7 The current workout screen gets a Finish button in its header, using the same use case. The full redesign lands in 5c.

## 1d — Web: profile and sign-out

- [x] 1d.1 `auth.api.ts`: `getMe()` and `signOut()`, with stub-adapter tests.
- [x] 1d.2 App route "profile": email, rest-alert state, pending count, and the Sign out button (tinted, with an icon).
- [x] 1d.3 Sign out clears the query cache and does a full navigation to sign-in. The queue is kept. Tested.

## 2a — Catalog: exercises

- [x] 2a.1 `catalog/infrastructure/exercises.api.ts`: create, rename and archive, with tests.
- [x] 2a.2 `CatalogSegments` (Routines | Exercises | Equipment as links). Test the active segment.
- [x] 2a.3 App route "exercises": a list with mode chips, archived ones hidden behind "Show archived (N)", and an empty state that offers creating the first exercise.
- [x] 2a.4 The New exercise drawer: a name field and three mode cards (radio inputs inside labels), using react-hook-form and zod. Rename and archive happen from a row action. Invalidate `workoutsKeys.exercises()`.

## 2b — Catalog: equipment and the usage endpoint

- [x] 2b.1 API `GET /equipment/:id/usage`: a use case plus a repository query. Tests count distinct exercises and sets, and confirm another user's sets are never counted.
- [x] 2b.2 Web: app route "equipment" (list) and its detail page (bar weight or stack, usage, "Correct the bar weight…" linking to the existing recompute route, rename, and the Archive button with its one-line note).

## 3a — Routines: list and plan

- [x] 3a.1 `routines.api.ts`: list, get, create and rename, with tests.
- [x] 3a.2 App route "routines": cards (name, exercise names, entry count), New, and the segments.
- [x] 3a.3 App route "routines/[routineId]": the numbered plan (sets × reps, rest, mode note), Edit, and "Start <routine>" through `useStartWorkout()`.

## 3b — Routines: editing and rest

- [x] 3b.1 `routines.api.ts`: add exercise, change entry, remove entry and reorder, with tests.
- [x] 3b.2 The entry drawer: a 56 px sets stepper, from/to reps, rest chips (1:00, 1:30, 2:00, 3:00, 4:00), Save, and Remove. Validation follows the domain `TargetReps` rules.
- [x] 3b.3 Edit mode in the plan: reorder and add an exercise from the catalog.
- [x] 3b.4 Rest wiring: the workout route reads the routine of the open session, and `restSecondsFor(exerciseId)` falls back to 180. Tested. This closes MVP task 10.2.

## 4a — Up next: domain and API

- [x] 4a.1 Domain `upNext()`. The five spec scenarios are its tests.
- [x] 4a.2 API: the routines list adds `lastDoneAt` (grouped max over sessions) and `upNextRoutineId`. Repository and use-case tests.
- [x] 4a.3 API: the statistics week adds `trainedOn`. Test that only the user's sessions in the current week are counted.

## 4b — Up next: Home and the start entry points

- [ ] 4b.1 Home: the "<Routine> is up next." headline (or "Make your first routine"), the week strip from `trainedOn`, the routine list with "last done", and the stat cards.
- [ ] 4b.2 `RoutineStartSheet` (Start / See the plan) opened from a Home row. While a workout is open, rows are disabled with "finish the open one first".
- [ ] 4b.3 `StartMenu` on the center tab: Start <up next> (starts directly), Pick a different routine, and Empty workout. `RoutinePickerSheet` starts on tap.
- [ ] 4b.4 An "Up next" tag on the routines list.

## 5a — Workout: the last-sets endpoint

- [ ] 5a.1 API `GET /exercises/:id/last-sets?excludingSession=`: the most recent other session containing that exercise, with its sets numbered by `logged_at`. Tests: numbering, excluding the open session, none, and other users' data.
- [ ] 5a.2 Web: `useLastSets()` plus a prefetch for every routine exercise when the screen opens online.

## 5b — Workout: the keypad

- [ ] 5b.1 `keypad.reducer.ts`: digit, decimal (at most one), delete, step ±2.5 (never below 0), sameAsLast, switchField; reps are integers only. The reducer tests come first.
- [ ] 5b.2 `ValueTile` (button, `aria-pressed`, a full `aria-label`) and `SetKeypad` (chips, pad, Reps ›, Log, Close, a polite live region). jsdom tests: no `input` is rendered, and the value is announced.

## 5c — Workout: the focus screen

- [ ] 5c.1 `LastTimeCard` covering its four states (value, none, no set N, offline), with jsdom tests.
- [ ] 5c.2 The workout screen container and its components (header, exercise focus, tiles, done sets, ‹ Log set N › row). The keypad opens only while a tile is being edited. Sets are logged through the existing offline use case. Rest uses the routine's value.
- [ ] 5c.3 Remove the old set-entry form and logged-set list once nothing uses them.

## Device verification (manual, Ian, after 5c)

- [ ] DV-U1 Install the PWA and confirm it opens on Home.
- [ ] DV-U2 Log sets in airplane mode, finish the workout, reconnect, and confirm the sets and the finish appear in the right order.
- [ ] DV-U3 Edit weight and reps with VoiceOver on.
- [ ] DV-U4 Confirm the "last time" card goes offline mid-session without losing what was already read.

## Review Workload Forecast

These counts are added plus deleted lines, excluding the lockfile.

| Unit | Estimate | Unit | Estimate |
|---|---|---|---|
| 1a | ~220 | 3a | ~330 |
| 1b | ~380 | 3b | ~380 |
| 1c | ~390 | 4a | ~280 |
| 1d | ~170 | 4b | ~380 |
| 2a | ~350 | 5a | ~260 |
| 2b | ~300 | 5b | ~330 |
| | | 5c | ~400 |
| **Total** | **~4,170 over 13 units** | | |

- 400-line budget risk: **High** for the whole change; **Medium** per unit, since 1c, 3b, 4b and 5c sit near the limit.
- Chained PRs recommended: not applicable. Delivery is commits on main, one review unit per sub-slice, as with `web-api-client`.
- Decision needed before apply: confirm the per-unit review, as before. A unit that goes over 400 at apply time splits further.
