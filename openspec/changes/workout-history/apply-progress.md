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
