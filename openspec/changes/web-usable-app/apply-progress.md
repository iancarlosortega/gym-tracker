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

## Unit 2a — exercises catalog (uncommitted, awaiting Ian's local review)

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
