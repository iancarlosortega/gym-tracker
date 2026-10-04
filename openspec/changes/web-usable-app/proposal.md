# Proposal — web-usable-app

**Date**: 2026-10-04
**Change**: `web-usable-app`
**Inputs**: `exploration.md`, `research.md` (revision 1, done), the `state.yaml` preproposal (all decisions confirmed), and the design canvas https://claude.ai/artifact/4TJ4TW6rGcWBsdnjKjVsvC

## 1. Why

The backend covers the MVP, but the web app is only reachable by typing URLs.

- There is no navigation, and the home page is a stub.
- A workout can never be finished.
- A fresh account cannot create the exercises and equipment that logging needs.
- Routines, sign-out and the recompute entry point exist only in the API.

The owner cannot use the app at the gym. This change makes it usable end to end on the phone, following the screens chosen on the design canvas.

## 2. What this change delivers

### Web

- **App shell.**
  - Tab bar: Home · Progress · center + · Routines · Profile.
  - Header: logo plus a visual-only menu button.
  - While a workout is open, a mini bar ("routine · timer · sets" with Finish) appears, and the center button becomes the timer.
- **Home.**
  - The "<Routine> is up next." headline, the week strip, the routine list and this-week stats.
  - A routine row opens a sheet with **Start** and **See the plan**.
  - The center + opens a menu:
    - **Start <up next>** starts that routine directly.
    - **Pick a different routine** opens a sheet; tapping a routine starts it.
    - **Empty workout**.
- **Routines tab.** A segmented control switches between three views:
  - **Routines**: a list with an "Up next" tag. The plan view has Start and Edit. Each exercise is edited in a sheet with large controls (sets, rep range, rest chips), and can be removed. Routines can be created and reordered.
  - **Exercises**: a list with mode chips. New exercises are created in a sheet with a name and one of three mode cards. Exercises can be renamed and archived.
  - **Equipment**: a list. The detail screen shows the bar weight with **Correct the bar weight…**, which leads into the existing recompute preview. Equipment can be renamed and archived, and the detail shows usage counts.
- **Workout screen.**
  - Full screen, with minimize, the routine name, a timer and Finish.
  - One exercise at a time: a set progress bar, a **Last time · set N** card, weight and reps tiles, the sets already done, and ‹ Log set N ›.
  - The keypad appears only while a tile is being edited. It has −2.5 / Same as last / +2.5, a number pad, Reps › and Log.
  - Rest uses each routine entry's own duration.
- **Profile.** Email, rest-alert state, the count of sets waiting to sync, and **Sign out**.
- **Offline behaviour.** The workout screen keeps working offline:
  - Logging and **finishing** both go through the local queue.
  - Reads show an explicit offline state instead of loading forever.
  - The "Last time" card stays in place and reads "Offline · last time unavailable".

### API (new reads, no migrations)

- The **last-done date per routine**. The **up-next rule** lives in `packages/domain`: the active routine done longest ago, never-done routines first, ties broken by routine order.
- **Last time per exercise and set number**: the sets of that exercise from the most recent earlier session.
- **Equipment usage**: the number of exercises and sets that use a piece of equipment.
- **Late sets**: the API accepts a set for a finished session when the set's `logged_at` ≤ the session's `finished_at`. Sets logged after the finish are still refused.

## 3. Scope

### In scope

Everything in §2. W1/W2 from the `web-api-client` verify are fixed on the screens this change rebuilds. Task 10.2 of the MVP (rest per exercise) is closed by this change.

### Out of scope

- Workout history (a list of past sessions).
- Editing or deleting a logged set.
- Changing a stack machine's number of positions.
- Hamburger menu contents (notifications, settings).
- The `/statistics/volume` UI.
- The Progress tab redesign. It keeps today's statistics screens, which are only linked from the new nav.

## 4. Decisions (owner, 2026-10-04)

| # | Decision |
|---|---|
| D1 | Approach A: one change, delivered as vertical slices that are each usable on their own and reviewed one at a time. |
| D2 | Screens follow the chosen artboards on the design canvas. |
| D3 | Starting a workout is always explicit. A Home row opens a sheet; only the + menu's first item starts immediately. |
| D4 | Finishing with sets still queued: the server accepts late sets (`logged_at ≤ finished_at`). Finish also queues when offline. |
| D5 | When "last time" cannot be read, the card stays and shows "Offline · last time unavailable". |
| D6 | Value tiles are buttons and the keypad is made of buttons, so no system keyboard ever opens (research C1–C3). |
| D7 | UI rules: no small +/- buttons; controls are ≥56 px with preset chips; copy is short and plain; destructive actions have a tinted fill and an icon. |

## 5. Slices (delivery order)

1. **Shell and finishing.** Tab bar, header, home skeleton, mini bar, finish workout (queued), sign-out, Profile. The late-sets API change ships here, because finish depends on it.
2. **Catalog.** Exercises and equipment CRUD inside the Routines tab, and the recompute entry point.
3. **Routines.** List, plan, editing sheet, create and reorder, starting from a routine, rest per exercise.
4. **Up next.** The domain rule, the last-done read, the real home, the + menu and the picker.
5. **Workout screen.** The focus layout, the keypad, the last-time read and the offline states.

The tasks phase forecasts sizes. Any slice over 400 lines splits.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Late-sets rule weakens "finished means closed" | Accept only `logged_at ≤ finished_at`; tests for before, at and after the finish instant |
| Queued finish before queued sets | The queue sends sets before the finish intent; this order is tested |
| Offline workout regressions | IndexedDB and sync use cases are unchanged; their tests stay green; device check |
| Keypad accessibility | Buttons with labels plus a polite live region; checked with VoiceOver on a device |
| Size | Per-slice review, as in `web-api-client` |

## 7. Rollback

Each slice is a set of local commits on `main` that the owner reviews before any push. API changes are additive reads plus one relaxed rule, with no schema change. Reverting the commits restores the previous behaviour.
