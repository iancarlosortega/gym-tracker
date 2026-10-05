# Proposal: Instant taps, own routine order, and the last unit gaps

## Intent
Taps feel slow on the phone:
- The kg↔lb switch waits for a server round trip before it moves.
- Routine edits, reorders, renames and archives wait for the server and a refetch.
- Navigations go through a service worker that waits on the network with no deadline.

Three gaps are also left over from web-usable-app and per-side-loading:
- Home says nothing useful while a workout is open.
- Routines can't be put in the owner's order; ties sort alphabetically.
- Progress charts and the recompute screen still read kg.

## Scope
### In Scope
- **Optimistic updates**, following the TanStack v5 cache shape: `cancelQueries`, a snapshot, `setQueryData`, rollback on error, and invalidation on settle only when it is the last pending mutation (research R1/R2).
  - Display unit switch (kg↔lb), serialised with a `scope`.
  - Routines: rename, archive, entry change (targets, rest), entry remove, entry reorder (up/down taps no longer disabled while pending), and the new routine reorder.
  - Catalog: exercise and equipment rename and archive.
  - A failed optimistic write restores the value in place and shows a short inline message near it, with Retry where it fits (R7).
- **Perceived-speed fixes, where optimistic writes don't apply:**
  - Start workout navigates at once to the workout screen in a "starting" state.
  - The empty workout page's raw start goes through the same mutation.
  - Creates keep server ids and a short pending state.
- **Service worker:**
  - Leave cross-origin requests alone, so API GETs skip the SW.
  - Same-origin navigations and RSC payloads use network-first with a short timeout, then fall back to the cache.
  - Enable navigation preload and bump the cache name (R5).
- **Open session in the Query cache:**
  - The workout page reads the session, routine, exercises and equipment through React Query, instead of `useState` plus direct calls.
  - A session-progress query merges server sets with the IndexedDB queue.
- **Home headline while a workout is open:** "Push day, 3 of 5 done".
  - An exercise is done when its logged sets reach the plan's target sets. One set counts if the exercise has no target.
  - Exercises outside the plan don't count.
  - The headline links back to the workout.
- **User-defined routine order:**
  - A `routine.position` column, backfilled alphabetically per user.
  - `PUT /routines/order` with the full id list.
  - The list and up-next ties follow position. New routines go last.
  - On the web, drag from a handle (`@dnd-kit/core` + `@dnd-kit/sortable`: touch delay 250 ms / tolerance 5, keyboard sensor, announcements), plus Move up / Move down actions per row (R8).
- **Units in Progress and Recompute:**
  - Chart values, weekly list, record and set changes are converted from kg with `kilogramsToDisplay` and labelled with the user's unit.
  - The API stays canonical kg.

### Out of Scope
- Optimistic creates with client-generated ids (owner chose server ids).
- Persisting the Query or mutation cache across reloads. The IndexedDB set queue stays the only durable offline path (R3).
- Optimistic recompute preview/apply, bar-weight correction, sign-in/out, push subscription.
- PNG icons, the push device test, the TS pin (backlog from gym-tracker-mvp).

## Capabilities
### New Capabilities
- `responsive-ui`: taps reflect immediately, failed changes roll back visibly, and navigation doesn't wait on a slow network.

### Modified Capabilities
- `routines`: the user orders routines; up-next ties follow that order.
- `app-shell`: Home shows open-workout progress; start opens the workout screen at once.
- `display-unit`: Progress and Recompute read in the chosen unit.

## Approach
Use cache-shape optimistic mutations behind a small shared helper in `apps/web/src/lib`: the mutation key, scope, snapshot and rollback, the guarded invalidate, and the rollback message. Each feature's `queries.ts` uses that helper.

The routine order is built bottom-up: domain, then the migration, then the API, then the web. Units are converted at the web edge.

The service-worker change is isolated, with its own tests and a cache bump.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/lib/` | New | optimistic mutation helper + rollback message |
| `apps/web/src/features/{auth,routines,catalog}/presentation` | Modified | optimistic mutations, inline rollback |
| `apps/web/src/features/{workouts,measurement}/presentation` | Modified | start navigation, session in Query cache, progress query |
| `apps/web/src/features/home/presentation` | Modified | open-workout headline |
| `apps/web/src/features/{statistics,recompute}/presentation` | Modified | display unit |
| `apps/web/public/sw.js` | Modified | skip cross-origin, timeout, preload, cache bump |
| `packages/domain/src/routines` | Modified | routine position, reorder rule, up-next by position |
| `apps/api/drizzle/0002_*.sql`, `apps/api/src/modules/routines` | New/Modified | position column + backfill, `PUT /routines/order` |
| `apps/web/package.json` | Modified | `@dnd-kit/core`, `@dnd-kit/sortable` |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rapid taps race and flicker | Med | `scope` serialisation + guarded invalidate; hook tests with deferred responses |
| Moving the workout page onto Query breaks offline logging | Med | keep the IndexedDB queue as source of truth; port the existing container tests first |
| SW change pins or breaks installed phones | Med | cache bump, `sw.test.ts` for each route class, device check |
| Long-press on iOS opens the callout instead of dragging | Med | handle with `touch-action`/`user-select: none`; Move up/down fallback; device check |
| Backfill order wrong for existing routines | Low | deterministic `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY name, id)` with an SQL test |

## Rollback Plan
- Revert the slice commits.
- Migration `0002` only adds a column, so its down step drops it.
- The service worker rollback is a revert plus another cache-name bump.

## Success Criteria
- [ ] Tapping lb/kg moves the control and every weight on screen at once; going offline mid-switch keeps the choice until it syncs or fails visibly.
- [ ] Routine up/down and drag reorder move rows instantly, survive rapid taps in order, and persist after reload.
- [ ] A forced server error rolls the change back in place with a message.
- [ ] Start workout shows the workout screen immediately.
- [ ] Home reads "Push day, 3 of 5 done" while a workout is open, including queued offline sets.
- [ ] Progress charts and recompute read lb when lb is selected.
- [ ] On the phone, tab switches on a weak connection don't hang on the service worker.
