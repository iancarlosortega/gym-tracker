# Exploration — web-usable-app

**Date**: 2026-10-04
**Change**: `web-usable-app`
**Phase**: explore (no implementation)
**Design input**: canvas https://claude.ai/artifact/4TJ4TW6rGcWBsdnjKjVsvC. Every screen on it was chosen by the owner on 2026-10-04.

## 1. Problem

The backend covers the MVP, but the web app is only reachable by typed URLs.

- The home page is a stub, and there is no navigation of any kind.
- A started workout can never be finished. `POST /workouts/:id/finish` has no caller.
- A fresh account cannot create exercises or equipment, so the set form has nothing to pick.
- Routines, sign-out, the recompute entry point and per-exercise rest exist in the API but have no UI.

## 2. Current state

| Area | API | Web |
|---|---|---|
| Navigation / home | — | `/` renders "Gym Tracker"; `layout.tsx` has no nav; manifest `start_url` is `/workout` |
| Workout lifecycle | start (with optional `routineId`), current, finish, sets | start without a routine; finish missing |
| Routines | full CRUD, entries (sets, rep range, rest), reorder | none |
| Exercises / equipment | create, rename, archive; bar-weight correction | read-only selects |
| Recompute | preview / apply | screen exists, nothing links to it |
| Auth | sign-in, sign-out, `GET /auth/me` | sign-in only |
| Rest per exercise | in routine entries | `restSecondsFor` never wired; always 3:00 (MVP task 10.2) |

## 3. Data the new design needs, and where it comes from

None of this needs a migration. Each item is a new read over existing tables and indexes.

| Need (design) | Source |
|---|---|
| Routine "last done" and the "up next" rule | `workout_session.routine_id` plus `started_at` (index `user_id, started_at`) |
| "Last time" per exercise and set number | `logged_set` by exercise and `logged_at` (index `exercise_id, logged_at`), ordered within the latest earlier session |
| Equipment usage ("used in N exercises · N sets") | `logged_set.equipment_id`, `routine_exercise.equipment_id` |
| Week strip (days trained) | `workout_session.started_at` for the current week; `/statistics/week` may already cover part of this |

**Up next (owner's rule)**: the active routine whose last session is oldest, with never-done routines first. Ties break by routine order. This is a domain rule and belongs in `packages/domain`.

## 4. Screens (from the canvas)

1. **Shell**: header with the logo and a hamburger (visual only for now), and a tab bar (Home · Progress · center + · Routines · Profile). While a workout is open, a mini bar above the tab bar shows "routine · timer · sets" with Finish, and the center + becomes the timer.
2. **Home**:
   - "<Routine> is up next." headline, then the week strip, a "Start a routine" list, and the this-week stats.
   - A routine row opens a sheet: Start / See the plan.
   - The center + opens an upward menu: Start <up next> (starts directly), Pick a different routine (a sheet where a tap starts), and Empty workout.
3. **Routines tab**: segmented Routines | Exercises | Equipment.
   - **Routines**: a list with an "Up next" tag. The plan view has Start in the thumb zone and Edit. Tapping an exercise opens a sheet with large controls (sets stepper, from/to reps, rest chips) plus Remove.
   - **Exercises**: a list with mode chips. The New sheet has a name field and three mode cards.
   - **Equipment**: a list. The detail screen shows the bar weight with "Correct the bar weight…" (into the existing recompute), Rename, and Archive.
4. **Workout**:
   - Full screen with minimize, name, timer and Finish.
   - Focus layout: exercise N of M, a set progress bar, a "Last time · set N" card, two value tiles, done sets, and ‹ Log set N ›.
   - The keypad appears only while a tile is being edited. It has −2.5 / Same as last / +2.5, a 60 px pad, "Reps ›", and Log.
5. **Profile**: email, the This-phone section (rest alerts, pending sync), and Sign out.

UI rules set during design: no small +/- buttons; controls are ≥56 px and use chips; copy is short and plain; destructive actions get a tinted fill and an icon; starting a workout is always an explicit action.

## 5. Approaches

### A. One change, sliced vertically (recommended)
One SDD change, delivered as several reviewed slices: shell and finish first, then catalog, routines, the workout screen and profile, with the backend reads landing in the slice that first needs them.
- Pro: a single spec and design for one coherent app; each slice is usable on its own.
- Con: a large change, probably 2,500–4,000 lines over many slices.

### B. Two changes: "usable" then "polished"
The first change covers shell, finish, catalog CRUD, routines CRUD and sign-out with today's workout screen. The second covers the new workout screen, last-time data and up next.
- Pro: the app becomes usable sooner, and the archive points are smaller.
- Con: the home design depends on "up next", so the first change would ship a temporary home.

### C. Backend first, then UI
- Con: nothing becomes usable until the end. Rejected.

## 6. Risks

- **Size.** The 400-line budget forces many slices. Owner-reviewed per-slice delivery already worked for `web-api-client`.
- **Offline-first workout screen.** The redesign must keep the IndexedDB queue and sync use cases intact. Today the "last time" read is online-only, so the screen must work when it is unavailable.
- **Finishing with unsynced sets.** Finishing a session while sets are still queued must not lose them. The order of finish and sync needs a rule.
- **Keypad on iOS.** A custom keypad means inputs must not open the system keyboard (`inputMode="none"` or read-only fields), and VoiceOver must still be able to enter values.
- **W1/W2 from the `web-api-client` verify** (late unreachable message, offline queries paused) land in the same screens, so they should be fixed in passing.
- **"Up next" semantics** need tests: never-done first, archived routines excluded, ties.

## 7. Out of scope (recorded for a later change)

- Workout history (a list of past sessions) and editing or deleting a logged set. The API is missing both.
- Changing a stack machine's number of positions. The API cannot do it.
- Hamburger menu contents (notifications, settings).
- `/statistics/volume` UI.

## 8. Recommendation

Approach **A**: one change, with vertical slices in this order:
1. shell, home skeleton, finish workout, sign-out
2. catalog
3. routines and starting from a routine, including rest per exercise
4. up next and last-done reads, plus the real home
5. workout screen with last-time data
6. profile and polish
