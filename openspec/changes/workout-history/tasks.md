# Tasks — workout-history

Strict TDD (red → green → refactor). Each unit is a commit to main once its tests, typecheck, biome and build pass. Units are sliced to stay within the 400-line review budget (auto-chain). Commit each unit after Ian's local review.

## S1 — Domain: correcting a set, set and workout deletion ports
- [x] 1.1 `LoggedSet.correct({ load, reps })` builds the entry from the set's mode and snapshot. The result is a new revision; snapshot, exercise, equipment and `loggedAt` are unchanged. Tests cover TOTAL, PER_SIDE with and without a bar, STACK, an lb snapshot kept, and a wrong load kind refused (D1).
- [x] 1.2 `SetNotFoundError` (`SET_NOT_FOUND` → 404) and `LoadCorrectionMismatchError` (`LOAD_CORRECTION_MISMATCH` → 400), with their HTTP mappings.
- [x] 1.3 `WorkoutSessionRepository.delete(id)`: Drizzle implementation with a PGlite test (sets cascade, other sessions untouched, silent when missing). The `WorkoutHistoryRepository` read model and its entry type (D4, D6). The push port is unchanged: workout delete uses `cancelForSet` per set.
- [x] 1.4 `InMemoryWorkoutSessionRepository.delete`. The history double arrives with its use case in S3.

## S2 — API: correct and delete a set
- [x] 2.1 `CorrectSetUseCase`:
  - `findOne` → `findOwnedWorkout` → build the entry from the mode and `snapshot.barGrams` (STACK checks `allowsPosition`) → `correct` → `save`;
  - a missing or foreign set → `SetNotFoundError` (D1, D2, D9).
- [x] 2.2 `DeleteSetUseCase`: a live, owned set → `delete` plus `PushScheduler.cancelForSet`; a missing, repeated or foreign set → 404 (D3).
- [x] 2.3 `PATCH /sets/:id` and `DELETE /sets/:id` controllers and DTO (`{grams?|position?, reps}`, exactly one of grams and position). `SET_NOT_FOUND` → 404 in `measurement.http-errors.ts`. Controller tests with supertest.
- [x] 2.4 `LoggedSetView` gains `rawGrams` and `revision`. Check the Drizzle `saveMany` upsert carries a higher-revision correction. PGlite test: a corrected row is updated and a stale revision loses.

## S3 — API: history list and workout delete
- [x] 3.1 `DrizzleWorkoutHistoryRepository` and its in-memory double: one query that is user-scoped, newest first (`started_at DESC, id DESC`), with the routine name and a count of live sets, using limit and offset. PGlite tests: tombstones are not counted, another user is excluded, paging neither repeats nor skips.
- [x] 3.2 `ListWorkoutsUseCase` + `GET /workouts?limit&offset` → `{ items, nextOffset }`.
- [x] 3.3 `DeleteWorkoutUseCase`: `findOwnedWorkout` → `cancelForSet` for each of its sets → `sessions.delete`. Use-case test: unsent pushes for its sets are removed, other sessions are untouched.
- [x] 3.4 `DELETE /workouts/:id` controller (204; foreign → 404).

## S4 — Web: shared set entry, editor drawer, offline paths
- [x] 4.1 Extract `weightTile` and `entryFor` from `workout-screen.container.tsx` into `features/measurement/presentation/set-entry.ts` with unit tests; the container behaves as before (D8).
- [x] 4.2 API client `correctSet` and `deleteSet`. `HttpSetSyncGateway.push` throws `WorkoutGoneError` on 404. `SyncPendingSetsUseCase` drops that batch, while other failures keep it (D5).
- [x] 4.3 Set mutations:
  - a queued set: `LoggedSet.correct` → `queue.save`, or `queue.delete`;
  - a synced set: `optimisticMutation` scoped `['set', id]`, which patches session sets and invalidates statistics, last sets, current and routines;
  - a DELETE that gets a 404 counts as done.
- [x] 4.4 `SetEditorDrawer`, presentational: keypad tiles, Save, Delete set. Opened from the open workout's done rows (`DoneSets`). The rollback notice shows on failure. RTL tests: edit while queued offline, a synced edit rolled back, delete.

## S5 — Web: History list, calendar and workout detail
- [x] 5.0 **Design options**: published at https://claude.ai/artifact/7ydVYMCcLY462ZjjzewjXn. Ian chose a combination: list A by default, plus a toggle to calendar B (D7b).
- [x] 5.1 API: `GET /workouts` takes optional `from` and `to` instants. `GET /workouts/:id` returns one workout as history shows it (`WorkoutHistoryRepository.entry`), so a detail page opened directly has its routine name and times. It is registered after `/workouts/current`, and a test pins that order. `WorkoutHistoryRepository.page` filters `started_at` to `[from, to)`. Tests cover PGlite, DTO and use case.
- [x] 5.2 Web history client and queries: an infinite list (offset paging) and a month read (`from`/`to`, limit 200). Pure helpers group the list by local week and bucket the month by local day.
- [x] 5.3 Routes `/statistics/history` and `/statistics/history/[workoutId]`, and a Progress | History switch on the Progress screen.
  - The list shows rows grouped by week: local day, routine name or "No routine", set count, duration, and an in-progress badge.
  - A List | Calendar toggle is kept in `?view=`.
  - The month grid has trained-day dots, previous and next month, and a list of the selected day's workouts.
- [x] 5.4 Workout detail:
  - sets grouped by exercise, in log order and in the display unit;
  - tapping a set opens the `SetEditorContainer`;
  - Delete workout: a confirmation naming the routine and date → working state → on 204 go back to History and invalidate; the workout's queued sets are dropped first (D5); a failure keeps the workout and shows a message.
- [ ] 5.5 A Home "History" link and a Profile "History" row. `activeTab` keeps Progress current. Bump the service worker cache version.

## Device verification
- [ ] DV.1 Correct and delete a set during a workout, including once in airplane mode.
- [ ] DV.2 Open History from Progress, Home and Profile. Read a past workout, correct a set, and see progression move.
- [ ] DV.3 Delete a test workout. It leaves History, the week strip and "Last done".

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| S1 | ~220 |
| S2 | ~380 |
| S3 | ~380 |
| S4 | ~400 |
| S5 | ~400 (after design pick) |

- Total: about 1,800 lines.
- Chained PRs recommended: Yes. There are five units, each one commit to main (no PRs; sole developer).
- 400-line budget risk: Medium. S4 and S5 sit at the edge, so split each into a and b if it runs over.
- Decision needed before apply: No (auto-chain).
