# Design: Workout history, set corrections and deleting a workout

## Technical Approach
The server is the source of truth for synced sets, and the IndexedDB queue is the source of truth for queued ones. The change needs no migration and no change to the sync wire format.

- **Server reads:** one new paginated read over sessions, plus the existing `GET /workouts/:id/sets` for the detail.
- **Server writes:** three new endpoints. The set delete reuses the existing soft delete. A workout delete is a hard delete that cascades to its sets.
- **Web:** History is a Progress sub-route. Corrections run through `optimisticMutation`. Workout delete is pessimistic.

## Architecture Decisions

### D1: The correction lives on `LoggedSet` and resolves against the snapshot
**Choice**: `LoggedSet.correct({ load, reps })` returns a new instance with revision+1. `load` is `{ grams }` for a set measured by mass (the per-side value for PER_SIDE, as typed) or `{ position }` for a stack set. The entity builds the entry from its own mode:
- TOTAL → `LoadEntry.total(grams)`;
- PER_SIDE → `LoadEntry.perSide(grams, snapshot.barGrams)`;
- STACK → `LoadEntry.stack(position)`.

A load of the wrong kind throws `LoadCorrectionMismatchError` (`LOAD_CORRECTION_MISMATCH`, mapped to 400). The use case still checks `equipment.allowsPosition` for a stack correction. `correctReps` stays as it is.

**Alternatives**:
- Resolve against the equipment's current bar, like a new set does.
- Have callers build the `LoadEntry`. The API and the offline queue would each repeat the snapshot rule.

**Rationale**:
- The measurement spec says the snapshot does not change. A correction fixes what was entered, not how it was measured, which is also why recompute can later run over the same set without conflict.
- Keeping the rule in the entity means the API and the web queue cannot disagree.

### D2: Sets are addressed at the root; ownership goes through the session
**Choice**:
- Routes are `PATCH /sets/:id` and `DELETE /sets/:id`.
- The use cases call `sets.findOne(Criteria.where({ id }))` and then `findOwnedWorkout(sessions, userId, set.sessionId)`.
- A missing or foreign set throws `SetNotFoundError` (`SET_NOT_FOUND`, mapped to 404). A foreign session surfaces the same error, so the API never confirms that someone else's set exists.

**Alternatives**: `/workouts/:wid/sets/:id`. The client would have to know the session id for every set, and it does, but the second id adds a mismatch case for no gain.
**Rationale**: matches how `findOwnedWorkout` already hides foreign workouts.

### D3: Deleting a set: 404 when already gone, and the client takes that as success
**Choice**:
- `DeleteSetUseCase` finds the live set (`findOne`, which already excludes tombstones) and checks ownership. It calls `sets.delete(id)` (soft delete) and the existing `PushScheduler.cancelForSet(id)`, then returns 204.
- A missing, already deleted or foreign set → `SetNotFoundError` → 404.
- The web delete mutation treats a 404 as done: the set is gone either way.

**Alternatives**: widen the closed `SetCriteriaFields` with `includeDeleted` so the server can answer 204 on a repeat. That adds a criterion only one caller would use.
**Rationale**:
- A retried DELETE after a lost response must not show an error toast. The client handles that without widening the port.
- `cancelForSet` already exists for the rest alert, so the spec's "alert is not sent" costs one call.

### D4: Deleting a workout is a hard delete, and it waits for the server
**Choice**:
- Add `WorkoutSessionRepository.delete(id)`. `DELETE /workouts/:id` uses `findOwnedWorkout` and deletes the row. `logged_set` goes by the existing `ON DELETE CASCADE`.
- The unsent `scheduled_push` rows of those sets are deleted first. The use case reads the session's set ids and calls the existing `PushScheduler.cancelForSet` for each, so the push port is unchanged.
- On the web the action is pessimistic: confirm, then a working state, then on 204 navigate to History and invalidate.

**Alternatives**: soft delete with a `deleted_at` on `workout_session`. That needs a migration and a filter on every session read (up next, week and last done), for an undo the owner did not ask for.
**Rationale**:
- Week, trained days and "Last done" all read `workout_session.started_at`, so a hard delete fixes all of them for free.
- A destructive action on a lot of data is the case the responsive-ui spec already leaves pessimistic.

### D5: Queued sets of a deleted workout are dropped, never retried forever
**Choice**: two layers.
1. Before calling the API, the web delete removes the workout's queued sets. It runs `findMany({ sessionId })` on the queue and then `delete` for each set, so the port is unchanged.
2. `HttpSetSyncGateway.push` throws `WorkoutGoneError` on a 404. In `SyncPendingSetsUseCase.deliver`, that error deletes the batch from the queue, while every other failure keeps it as today.

This covers a delete made from another device, or with sets still in flight.

**Rationale**: today `deliver` swallows every error, so sets for a session that no longer exists would sit in the queue forever and keep the "pending" count above zero.

### D6: The history read is a dedicated query, not the session repository
**Choice**: `ListWorkoutsUseCase` uses a `WorkoutHistoryRepository` read model (`workouts/repositories/workout-history.repository.ts`, named like `RoutineHistoryRepository`). Its `page(userId, Pagination)` returns a `Page<WorkoutHistoryEntry>`, where an entry is `{ id, routineId, routineName | null, startedAt, finishedAt | null, setCount }`, newest first.
- The Drizzle adapter makes one query: `workout_session` LEFT JOIN `routine` LEFT JOIN a count of live `logged_set`, ordered by `started_at DESC, id DESC`, with `LIMIT`/`OFFSET` from the existing `Pagination` VO.
- `GET /workouts?limit&offset` returns `{ items, nextOffset | null }`, where `nextOffset` comes from `Page.hasMore`.

**Alternatives**: `WorkoutSessionRepository.findMany` plus N set counts (N+1), or add `setCount` to the entity (wrong layer).
**Rationale**: this follows the read-model pattern already used by `DrizzleRoutineHistory`, `DrizzleLastSets` and statistics. The `(user_id, started_at)` index serves it. Offset paging is good enough for a personal history, where the only writes are the user's own.

The client derives the local day from `startedAt` with the phone's zone (`local-calendar`). The server does no day grouping.

### D7: History is `/statistics/history`, under the Progress tab
**Choice**:
- Routes are `app/(app)/statistics/history/page.tsx` and `app/(app)/statistics/history/[workoutId]/page.tsx`.
- Progress gets a two-option switch (Progress | History) at the top.
- Home gets a "History" link beside the week headline, and Profile gets a "History" row.
- `activeTab` already maps `/statistics*` to `progress`, so no tab bar change is needed.
- The detail reuses `GET /workouts/:id/sets`, `exercises` and `equipment` to name the rows.

**Rationale**:
- The owner chose Progress, plus links from Home and Profile.
- Nesting under `/statistics` keeps the Progress tab marked.
- The layout of both pages is decided by design options (D10).

### D8: One set editor for the done rows and the detail
**Choice**:
- Extract `weightTile` and `entryFor` from `workout-screen.container.tsx` into `features/measurement/presentation/set-entry.ts` first (pure, tested).
- A `SetEditorDrawer` (presentational) wraps `SetKeypad` in the Base UI `Drawer`, with Save and Delete set. A container picks the path:
  - **queued set** (`pending: true`): a local `LoggedSet.correct`, then `queue.save`, or `queue.delete`;
  - **synced set**: `optimisticMutation` with `scope: ['set', id]`. It patches `workoutsKeys.sessionSets(sessionId)` and invalidates `statisticsKeys.all`, last-sets, `workoutsKeys.current()` and routines.
- On error, the existing rollback notice shows "Not saved" with Try again.

**Rationale**:
- One editor keeps the keypad rule ("no system keyboard") in one place.
- The scope serialises rapid edits of the same set, as the responsive-ui spec requires.

### D9: The correction request carries the same value shape as logging
**Choice**: `PATCH /sets/:id` body is `{ grams?: int, position?: int, reps: int }`, with exactly one of grams and position. This mirrors `LogSetDto`. PER_SIDE sends the per-side grams, as logging does.

`LoggedSetView` gains `rawGrams` (the per-side or total value as entered) and `revision`, so the editor opens on the entered value rather than the resolved total. The response is the updated `LoggedSetView`.

**Rationale**: no new value encoding. Without the raw value, the editor of a PER_SIDE set could only show 60 kg and not "20 per side".

### D10: Design options before page components
**Choice**: the History list and the workout detail are page-level. Their slice starts with design artifacts (Artifact `quickstart`, `intent: design`) for the owner to pick from, before any component is written. The set editor drawer reuses existing visuals and needs no options.

## Data Flow
```
Edit synced set:  Drawer ─► optimisticMutation(patch sessionSets) ─► PATCH /sets/:id
                                 │ error: rollback + notice          │ CorrectSetUseCase
                                 └ settled: invalidate stats/last/…  └► findOne → findOwnedWorkout → correct → save
Edit queued set:  Drawer ─► LoggedSet.correct ─► IndexedDB queue.save (revision+1) ─► later sync
Delete workout:   Confirm ─► drop queued sets(sessionId) ─► DELETE /workouts/:id ─► cancelForSet(each set) ─► delete session ⇒ cascade sets
History:          /statistics/history ─► GET /workouts?limit&offset ─► WorkoutHistoryRepository (1 query)
```

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `packages/domain/src/measurement/entities/logged-set.entity.ts` | Modify | `correct({load, reps})` builds the entry from the set's mode and snapshot. |
| `packages/domain/src/measurement/errors.ts` + `shared/errors/domain-error.ts` | Modify | `SetNotFoundError` (`SET_NOT_FOUND`) and `LoadCorrectionMismatchError` (`LOAD_CORRECTION_MISMATCH`). |
| `packages/domain/src/workouts/repositories/workout-session.repository.ts` | Modify | `delete(id)`. |
| `packages/domain/src/workouts/repositories/workout-history.repository.ts` | Create | The history read model and its entry type. |
| `apps/api/src/modules/measurement/application/use-cases/{correct-set,delete-set}.use-case.ts` | Create | D1–D3. |
| `apps/api/src/modules/measurement/presentation/{correct-set,delete-set}/*` | Create | Controllers and DTOs. |
| `apps/api/src/modules/measurement/measurement.http-errors.ts` | Modify | `SET_NOT_FOUND` → 404. |
| `apps/api/src/modules/measurement/presentation/logged-set.view.ts` | Modify | `rawGrams` and `revision`. |
| `apps/api/src/modules/workouts/application/use-cases/{list-workouts,delete-workout}.use-case.ts` | Create | D4 and D6. |
| `apps/api/src/modules/workouts/infrastructure/persistence/drizzle-workout-history.repository.ts` | Create | One-query history page. |
| `apps/api/src/modules/workouts/presentation/{list-workouts,delete-workout}/*` | Create | `GET /workouts` and `DELETE /workouts/:id`. |
| `apps/web/src/features/measurement/presentation/set-entry.ts` | Create | Extracted `weightTile` and `entryFor`. |
| `apps/web/src/features/measurement/presentation/set-editor/*` | Create | Drawer view, container, mutations. |
| `apps/web/src/features/measurement/infrastructure/{sets.api,http-set-sync.gateway}.ts` | Modify | `correctSet` and `deleteSet`; `WorkoutGoneError` on 404. |
| `apps/web/src/features/measurement/application/sync-pending-sets.use-case.ts` | Modify | Drop the batch on `WorkoutGoneError`. |
| `apps/web/src/features/workouts/{infrastructure,presentation}/history*` | Create | API client, queries, list and detail containers and views. |
| `apps/web/src/app/(app)/statistics/history/**` | Create | Routes. |
| `apps/web/src/features/{statistics,home}/presentation/**`, `apps/web/src/features/auth/presentation/components/profile-details.tsx` | Modify | Progress \| History switch, Home link, Profile row. |
| `apps/web/src/features/measurement/presentation/workout/workout-views.tsx` (`DoneSets`) | Modify | Done rows open the set editor. |

## Testing Strategy (Strict TDD)
| Layer | What | Approach |
|-------|------|----------|
| Domain | `correct` for every mode, snapshot kept, revision bump, mismatch guard | Vitest beside the entity |
| API use cases | correct, delete (repeat and foreign → 404, push cancelled), list paging, delete workout | In-memory repositories |
| API persistence | history query (counts exclude tombstones, newest first, user scoped), workout delete cascade and push cancel | PGlite |
| API controllers | routes, DTO validation, 404 mapping | supertest with stub use case |
| Web | `set-entry` pure functions, editor paths (queued and synced), rollback, sync drop on 404, history paging, delete flow | Vitest + RTL + fake-indexeddb |

## Migration / Rollout
No migration. `logged_set.deleted_at`, `revision` and the session cascade already exist. The service worker cache version is bumped in the web slice that adds the routes, so installed phones pick them up.

## Open Questions
None blocking. Page layouts are settled by design options at the start of the History slice (D10).
