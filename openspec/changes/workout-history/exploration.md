## Exploration: workout history, editing and deleting a logged set

### Current State
Recorded as out of scope in web-usable-app (§7): "Workout history (a list of past sessions) and editing or deleting a logged set. The API is missing both."

**API, today**
- Workouts: `POST /workouts`, `GET /workouts/current`, `POST /workouts/:id/finish`. There is no endpoint that lists past sessions.
- Sets: `POST /workouts/:id/sets` is an idempotent batch upsert, and `GET /workouts/:id/sets` returns up to 200 live sets ordered by `loggedAt`. There is no `PATCH` and no `DELETE`.

**Domain**
- `LoggedSet` (`measurement/entities/logged-set.entity.ts`) is immutable. Its only mutator is `correctReps`, which returns a new instance with revision+1 and has no callers.
- The invariant `assertSnapshotMatchesEntry` ties a PER_SIDE entry's bar to `snapshot.barGrams`. An edited PER_SIDE load must therefore keep the snapshot bar: `LoadEntry.perSide(newSide, set.snapshot.barGrams)`.
- `WorkoutSession` holds no sets. `finishedAt` is one-way. The trained day is derived on read from `startedAt` in the phone's zone.
- `SetRepository.delete(id)` already soft-deletes through `logged_set.deleted_at`. Every set read and statistics join excludes tombstoned rows, but no use case calls it.
- `WorkoutSessionRepository` has no `delete`. Its criteria are `{id, userId, routineId, finished}`, sorted by `startedAt`.

**Ownership**
- Sets carry no `user_id`. A set is addressed through its session with `findOwnedWorkout(sessions, userId, sessionId)`.
- A foreign set reads as not found, which matches the existing pattern.
- There is no `SET_NOT_FOUND` error code.

**Persistence**
- No migration is needed: `deleted_at` and `revision` already exist.
- The `(user_id, started_at)` index serves a history list ordered by `started_at`.
- `DrizzleSetRepository.saveMany` updates only reps, raw and resolved values, `logged_at`, `revision` and `synced_at`, guarded by revision. It never updates `mode`, `exercise_id`, `equipment_id` or the snapshot columns.

**Derived data**
- Everything is computed on read: the week, trained days, progression, volume, last time, up next and "Last done". Edits and deletes show up without any server invalidation.
- Trained days and "Last done" come from `workout_session.started_at`, not from sets. A session whose sets are all deleted still counts as a workout.
- The client invalidates TanStack keys `workoutsKeys.sessionSets`, `workoutsKeys.current`, `statisticsKeys.all`, last-sets, and the routines list.

**Web**
- The tab bar uses all five slots (Home, Progress, start, Routines, Profile), and `activeTab` must learn any new route.
- The done rows in the workout screen (`DoneSets`, `workout-views.tsx:109`) are read-only.
- Reusable pieces:
  - `optimisticMutation` (`lib/optimistic.ts`);
  - the Base UI `Drawer`;
  - `SetKeypad` and `keypadReducer`;
  - `weightTile` and `entryFor` (module-private in `workout-screen.container.tsx`, to be extracted).

**Offline**
- Queued sets live in IndexedDB. The queue's `delete` is a hard delete, and `save` is last-write-wins by `(revision, loggedAt)`. Editing or deleting a set that is still queued is therefore purely local.
- `HttpSetSyncGateway` sends no revision or delete signal, so there is no offline path for editing or deleting a set the server already has.

**Contracts**
- `@gym/contracts` is an empty placeholder. Web response types are written by hand next to each API client.

### Affected Areas
- `packages/domain/src/measurement` — `LoggedSet` gains a load correction beside `correctReps`, and `SetNotFoundError` is added.
- `packages/domain/src/workouts` — history read criteria, plus a session delete if it is chosen.
- `apps/api/src/modules/workouts` — `GET /workouts` (history list, paginated).
- `apps/api/src/modules/measurement` — `PATCH /sets/:id` and `DELETE /sets/:id`, the HTTP mapping for `SET_NOT_FOUND`, and a widened `saveMany` or a dedicated update.
- `apps/web/src/features/workouts` — history list and session detail routes, and the nav entry.
- `apps/web/src/features/measurement` — edit and delete on done rows (open workout) and in session detail; queue-local edit and delete for pending sets.
- `openspec/specs` deltas:
  - `workout-logging`: edit and delete of sets, and how they apply to late and finished sessions.
  - `responsive-ui`: set edit and delete join "Edits to existing things show at once".
  - `app-shell`: the history entry point.
  - `statistics`: deleted sets leave every aggregate.
  - `measurement`: an edit keeps the snapshot.

### Approaches
1. **History read-only plus set edit and delete, server-confirmed sets online only.**
   - `GET /workouts` returns a paginated list. A session detail reuses `GET /workouts/:id/sets`.
   - `PATCH` and `DELETE` on synced sets are optimistic and roll back when offline. Queued sets are edited or removed in IndexedDB.
   - Pros: no wire-protocol change and no migration, and it reuses `optimisticMutation`.
   - Cons: a synced set cannot be corrected while offline.
   - Effort: Medium.
2. **Offline-first edit and delete for every set.**
   - Extend the sync protocol with a revision and a tombstone, and widen `saveMany` to carry `deleted_at`.
   - Pros: corrections work offline too.
   - Cons: protocol change, conflict rules, and much more surface for a rare action.
   - Effort: High.

### Recommendation
Approach 1. Corrections are rare and usually done after the workout with signal. The open workout already handles offline sets through the queue. Online-only applies only to sets the server has.

### Open product questions (for the owner)
1. Where does history live? The tab bar is full.
2. What can an edit change: reps and load only, or also exercise and equipment?
3. Which workouts can be edited: the open one, finished ones, or both?
4. Can a whole workout be deleted, and what happens to an empty one?
5. The list's shape: grouped by week in the phone's zone, with paging. This is a design-exploration item, settled with design options before code.

### Risks
- Editing exercise or equipment would break snapshot semantics and widen the upsert. Keep it out unless the owner needs it.
- A delete racing a queued sync of the same id: a replayed create on a tombstoned row is a harmless no-op today. That must stay true.
- History list and session detail are important pages, so design options go to the owner before components are written.

### Ready for Proposal
Yes, once the open product questions are answered.
