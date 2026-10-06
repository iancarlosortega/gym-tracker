# Archive report — workout-history

Archived 2026-10-06 at openspec/changes/archive/2026-10-06-workout-history.

## Outcome
- **Verify**: PASS with warnings (12 requirements, 38 scenarios). See verify-report.md.
- **Device checks**: DV.1–DV.3 confirmed by Ian on the device (2026-10-06), on the local Docker stack over Tailscale. They also cover verify warning 1, the screen-level tap-to-edit path.

## Specs composed into openspec/specs
- `workout-history`: new capability (list, read, delete).
- `workout-logging`: correct and delete a set; queued sets are changed on the phone.
- `measurement`: a correction keeps the snapshot.
- `statistics`: corrected and deleted sets and workouts.
- `app-shell`: History reachable from Progress, Home and Profile.
- `responsive-ui`: "Edits to existing things show at once" now covers set corrections and deletions (MODIFIED); deleting a workout waits for the server (ADDED).

Composed with `gentle-ai sdd-archive-compose`, and the new capability copied as is. A blank line was restored before each appended requirement.

## Delivered
- **API**:
  - `PATCH` and `DELETE /sets/:id`;
  - `GET /workouts?limit&offset&from&to`;
  - `GET` and `DELETE /workouts/:id`.
  - No migration.
- **Web**:
  - the set editor in the workout screen and in History;
  - History as a week-grouped list with a calendar toggle;
  - the workout detail with delete;
  - links from Home and Profile;
  - service worker cache `gym-shell-v5`.

## Owner decisions
- History lives under Progress, with links from Home and Profile.
- A correction changes reps and load only.
- Sets can be edited and deleted in open and finished workouts.
- A whole workout can be deleted after a confirmation.
- The History layout is the list by default with a calendar toggle (D7b).

## Follow-ups
- None raised at close.
- Still in the backlog: TS pin B3, PNG icons, and DB backups (with the deploy).
