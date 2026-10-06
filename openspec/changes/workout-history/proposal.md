# Proposal: Workout history, set corrections and deleting a workout

## Intent
The app records every set, but no screen shows past workouts. A typo in a logged set stays forever, and so does a workout started by accident. Both were recorded as out of scope in web-usable-app (§7: "The API is missing both."). With the deploy coming, this is the last gap before the app holds real training history.

## Scope
### In Scope
- **History:** a list of past workouts, newest first, in the phone's time zone. It lives as a sub-view of Progress, with links to it from Home and Profile (owner, 2026-10-05).
- **Workout detail:** a past workout's sets, grouped by exercise, in the display unit.
- **Correct a set:** change its reps and load. Exercise, equipment and the resolution snapshot stay as logged (owner, 2026-10-05).
- **Delete a set.**
- Both corrections work in the open workout, from its done rows, and in finished workouts, from the detail (owner, 2026-10-05).
- **Delete a workout:** from its detail, after a confirmation. Its sets, its day in the week strip and its "Last done" go with it (owner, 2026-10-05).
- **API:**
  - `GET /workouts`, paginated history;
  - `PATCH /sets/:id` and `DELETE /sets/:id`;
  - `DELETE /workouts/:id`.
- **Offline:** a set still in the offline queue is corrected or removed in the queue. A set the server already has is corrected online, optimistically, and rolled back with a message on failure.

### Out of Scope
- Changing a set's exercise or equipment. To do that, delete the set and log it again.
- Offline corrections of sets the server already has, which would need a revision and tombstone on the sync wire.
- Editing a workout's start or finish times, or its routine.
- `/statistics/volume` UI, and filters or search in history.
- Starting `@gym/contracts`: the response types stay hand-written next to each client, as today.

## Capabilities
### New Capabilities
- `workout-history`: list past workouts, read one, delete one.

### Modified Capabilities
- `workout-logging`: a logged set can be corrected (reps and load) or deleted, in the open workout and in finished ones.
- `measurement`: a corrected set keeps its resolution snapshot.
- `statistics`: deleted sets and workouts leave every aggregate.
- `app-shell`: history is reachable from Progress, Home and Profile.
- `responsive-ui`: set corrections and deletions join "Edits to existing things show at once".

## Approach
Approach 1 from the exploration: the server is the source of truth for synced sets, and the queue is the source of truth for queued ones.

1. **Domain**
   - `LoggedSet.correct({ load, reps })` re-resolves the load against `snapshot.barGrams`, which keeps the invariant, and bumps the revision.
   - New `SetNotFoundError` with code `SET_NOT_FOUND`.
   - `WorkoutSessionRepository.delete`.
2. **API**
   - Use cases for list workouts, correct set, delete set and delete workout.
   - Set ownership goes through `findOwnedWorkout`. A foreign set or workout reads as not found.
   - The set delete reuses the existing soft delete.
   - A workout delete removes the session row, and its sets go with it through the existing `ON DELETE CASCADE`.
   - No migration.
3. **Web**
   - Progress gets a History view, and Home and Profile link to it.
   - The workout detail and the open workout's done rows get Edit and Delete.
   - Edit opens the existing keypad in a drawer.
   - Changes go through `optimisticMutation`, which patches the session's sets and invalidates statistics, last sets, current and routines.
4. **Design first:** the History list and the workout detail are important pages, so design options go to the owner before their components are written.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| A queued set syncs after the user deleted its workout | Low | Delete the workout's queued sets with it. The API refuses sets for a missing workout as 404, and the sync drops them instead of retrying forever. |
| A rest-end push still fires for a deleted set | Low | Cancel the pending `scheduled_push` for that set when it is deleted. |
| A correction breaks the PER_SIDE snapshot invariant | Low | Resolve against `snapshot.barGrams`, never the equipment's current bar. Domain tests for every mode. |
| Deleting a workout by mistake | Med | A confirmation names the workout and its date. There is no undo after the server confirms. |
| The workout screen container (530 lines) grows further | Med | Extract `weightTile` and `entryFor` into a shared module first. |

## Success Criteria
- [ ] Progress → History lists past workouts newest first, by local day, and Home and Profile reach it in one tap.
- [ ] Opening a workout shows its sets by exercise in the display unit.
- [ ] Correcting 8 reps to 10, or 60 kg to 62.5 kg, shows at once, survives a reload, and moves progression.
- [ ] Deleting a set removes it from the workout, the statistics and "last time".
- [ ] Deleting a workout after confirming removes it from history, the week strip and "Last done".
- [ ] Offline: a still-queued set can be corrected or deleted. A synced set's correction fails visibly and rolls back.
