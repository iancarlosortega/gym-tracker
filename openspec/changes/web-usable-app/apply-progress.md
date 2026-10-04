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

## Unit 3a — routines list and plan (uncommitted, awaiting Ian's local review)

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
