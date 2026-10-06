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
