# Apply progress — workout-history

Strict TDD. The units ran inline, because the hook refuses `sdd-apply` sub-agents.

## S1 — Domain: correcting a set, set and workout deletion ports (2026-10-06)
Status: done and checked; uncommitted, awaiting Ian's local review.

- **RED → GREEN**
  - `logged-set.entity.test.ts` gained 7 correction tests. 5 failed before the implementation; all 22 pass.
  - `drizzle-workout-session.repository.test.ts` is new, with 3 PGlite tests. They failed with `repository.delete is not a function` and now pass.
- **Changes**
  - `LoggedSet.correct({ load, reps })`.
  - `LoadCorrection` and `SetCorrection` types.
  - `LoadCorrectionMismatchError` and `SetNotFoundError`, registered as codes and mapped to HTTP 400 and 404.
  - `WorkoutSessionRepository.delete`, with Drizzle and in-memory versions.
  - The `WorkoutHistoryRepository` read model.
- **Deviations from the first design**, now recorded in design.md:
  1. `correct` takes `{grams}|{position}` instead of a prebuilt `LoadEntry`, so the snapshot rule lives in one place.
  2. There is no `cancelForSession`. Workout delete calls the existing `cancelForSet` for each set.
  3. The read model is named `WorkoutHistoryRepository`, after `RoutineHistoryRepository`.
- **Checks**
  - `pnpm typecheck`: green.
  - `pnpm test`: domain 235, web 435 and api 272, all passing.
  - `pnpm lint`: clean, after biome import ordering.

## S2 — API: correct and delete a set (2026-10-06)
Status: done and committed. Ian waived review for this change.

- **RED → GREEN**
  - `correct-set.use-case.test.ts` (7 tests) and `delete-set.use-case.test.ts` (4 tests) failed with the module missing, and now pass.
  - `correct-set.controller.test.ts` (9 tests, covering PATCH and DELETE) failed with the controller missing, and now passes.
- **Changes**
  - `findOwnedSet` (`find-set.ts`) reads a missing, deleted or foreign set as `SetNotFoundError`.
  - `CorrectSetUseCase` checks a stack correction with `allowsPosition` when the machine still exists.
  - `DeleteSetUseCase` does the soft delete plus `PushScheduler.cancelForSet`.
  - `PATCH /sets/:id` (200 with `LoggedSetView`) and `DELETE /sets/:id` (204).
  - `CorrectSetDto` takes exactly one of grams and position.
  - `LoggedSetView` gains `rawGrams` and `revision`.
  - `PushModule` now exports `PUSH_SCHEDULER`, and `MeasurementModule` imports `PushModule`.
- **Contract**: two cases were added to `describeSetRepositoryContract`, a corrected load and a corrected position. They passed immediately on both the Drizzle (PGlite) and IndexedDB adapters, which confirms the existing upsert already carries corrections. No adapter change was needed.
- **Checks**
  - `pnpm typecheck`: green.
  - `pnpm test`: domain 235, web 437 and api 294, all passing.
  - `pnpm lint`: clean.
  - API build: OK.

## S3 — API: history list and workout delete (2026-10-06)
Status: done and committed.

- **RED → GREEN**
  - `drizzle-workout-history.repository.test.ts` (3 PGlite tests: newest first with routine name and live set count; paging without repeats; user scoping).
  - `list-workouts.use-case.test.ts` (3).
  - `delete-workout.use-case.test.ts` (3).
  - `list-workouts.controller.test.ts` (3).
  - `delete-workout.controller.test.ts` (2).
  - All failed with the module missing before the implementation.
- **Changes**
  - `DrizzleWorkoutHistoryRepository`: one grouped query, plus a count. Ties are broken by id.
  - `InMemoryWorkoutHistoryRepository`.
  - `ListWorkoutsUseCase` returns `{items, nextOffset}`.
  - `GET /workouts?limit&offset`.
  - `DeleteWorkoutUseCase`: ownership check, `cancelForSet` for each of the session's sets, then `sessions.delete`.
  - `DELETE /workouts/:id` (204, 404).
- **Deviation**: workout delete lives in the measurement module to avoid circular module imports (design D4 updated).
- **Wiring**: a temporary test compiled the real `WorkoutsModule` and `MeasurementModule`, with PGlite as `DATABASE`, and resolved all four new use cases. It was removed afterwards.
- **Checks**
  - `pnpm typecheck`: green.
  - `pnpm test`: domain 235, web 437 and api 308, all passing.
  - `pnpm lint`: clean.
  - API build: OK.

## S4 — Web: shared set entry, editor drawer, offline paths (2026-10-06)
Status: done and committed in two parts, 4a `2a8170d` (logic) and 4b (UI).

- **4a**
  - `set-entry.ts` now holds `weightTile` and `entryFor`, moved from the workout screen, plus new `correctionFor` and `enteredValue`.
  - `sets.api.ts`: `correctSet`, and `deleteSet`, which takes a 404 as done.
  - `HttpSetSyncGateway` throws `WorkoutGoneError` on a 404, and `SyncPendingSetsUseCase` drops that batch.
  - `DoneSet` and `LoggedSetResponse` gain `mode`, `rawGrams` and `revision`.
  - `useCorrectSet` and `useDeleteSet` (`set-edits.queries.ts`) are optimistic. A queued set is rewritten or removed in IndexedDB; a synced set goes through PATCH or DELETE and rolls back on error.
  - Tests: set-entry (9), sets.api (4), gateway 404 (1), sync drop (1), done-sets fields, and hooks (5, against a real QueryClient and fake-indexeddb).
- **4b**
  - Done rows become buttons labelled "Edit set N, …".
  - `SetKeypad` gains `submitLabel`.
  - `SetEditor` is presentational: tiles, keypad with Save, and Delete set N.
  - `SetEditorContainer` stays mounted so the rollback notice outlives the drawer, and keys the keypad state by set.
  - The workout screen wires it in.
  - Tests: DoneSets edit (1), SetEditor (3), container (3).
- **Not covered**: there is no screen-level tap-to-edit test, because the workout-screen test mocks the server's sets as empty. Both halves are tested separately, and typecheck covers the wiring. Device check DV.1 covers the rest.
- **Checks**
  - `pnpm typecheck`: green.
  - `pnpm test`: domain 235, web 464 and api 308, all passing.
  - `pnpm lint`: clean.
  - Web build: OK.

## S5 — Web: History list and workout detail (2026-10-06)
Status: waiting on 5.0. Design options were published at https://claude.ai/artifact/7ydVYMCcLY462ZjjzewjXn:
- A: grouped by week (recommended);
- B: month calendar;
- C: summary cards.

No components are written until Ian picks one.
