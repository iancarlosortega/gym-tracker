# Verify report — workout-history

Verified 2026-10-06, inline, because the hook refuses `sdd-verify` sub-agents.

**Verdict: PASS with warnings.** 12 requirements and 38 scenarios.
- 32 scenarios are covered by automated tests.
- 4 are covered by derivation from existing tested filters.
- 2 are left to the device checks.

**Checks at verification**
- `pnpm typecheck`: green.
- `pnpm test`: domain 235, web 509 and api 317, all passing.
- `pnpm lint`: clean.
- Web and API builds: OK.

## Coverage by spec

### workout-history
| Scenario | Evidence |
|---|---|
| Two workouts this week, newest first | `drizzle-workout-history.repository.test.ts` (order, routine, live set count); `history-views.test.tsx` (rows under weeks) |
| More workouts than one page | PGlite paging (no repeats or skips); `history.queries.test.tsx` (next offset); `HistoryList` shows "Show older workouts" |
| Another user's workouts never listed | PGlite user scoping; `list-workouts.use-case.test.ts` |
| No workouts yet | `history-views.test.tsx` |
| Reading Push day set by set | `workout-detail.container.test.tsx` (groups in order, kg labels); `workout-detail.test.tsx` |
| A workout that is not the user's | `get-workout.use-case.test.ts`; `entry()` PGlite scoping |
| Deleting a workout started by accident | `delete-workout.use-case.test.ts`; `drizzle-workout-session.repository.test.ts` (cascade); container navigates back. Week strip and Last done are derived: both read `workout_session`, which is gone (**derived**) |
| Cancelling the confirmation | `workout-detail.test.tsx` |
| Deleting the open workout drops its waiting sets | `history.queries.test.tsx` (queued sets and queued finish dropped); `sync-pending-sets.use-case.test.ts` (404 → batch dropped). "A new workout can be started" is not tested: the open-session lookup simply finds none (**derived**) |
| Deleting someone else's workout | `delete-workout.use-case.test.ts`; controller 404 |

### workout-logging
| Scenario | Evidence |
|---|---|
| Fixing a typo during the workout | `set-edits.queries.test.tsx`; `SetEditorContainer` tests. There is no screen-level tap test (**warning**) |
| Correcting a finished workout | `correct-set.use-case.test.ts` (works whatever the session state); the detail page wires the editor |
| Correcting a per-side set | domain `logged-set.entity.test.ts`; `correct-set.use-case.test.ts` (70 kg) |
| Correcting a plate set | domain and use case tests (position 8, no mass) |
| A plate outside the machine's range | `correct-set.use-case.test.ts` (refused, set unchanged) |
| Correcting someone else's set | `correct-set.use-case.test.ts` |
| Deleting a duplicate set | `delete-set.use-case.test.ts`; optimistic removal in `set-edits.queries.test.tsx` |
| Deleting the last set of an exercise | Last-time reads filter `deleted_at` (`drizzle-last-sets.repository.ts`) (**derived**) |
| Deleting a set again | `delete-set.use-case.test.ts` (404); `sets.api.test.ts` (404 taken as done) |
| A pending rest alert for a deleted set | `delete-set.use-case.test.ts` |
| Correcting a set while offline | `set-edits.queries.test.tsx` (queue rewritten, server untouched) |
| Deleting a set while offline | `set-edits.queries.test.tsx` |
| Correcting a synced set while offline | `set-edits.queries.test.tsx` (rollback on failure); `RollbackNotice` shows "Not saved" |

### measurement
| Scenario | Evidence |
|---|---|
| The bar weight changed since the set was logged | `correct-set.use-case.test.ts`; set repository contract (both adapters) |
| A per-side set logged without a base weight | domain test |
| The entered unit is kept | domain test (lb snapshot unchanged) |

### statistics
| Scenario | Evidence |
|---|---|
| A corrected best set | Progression reads `resolved_grams`, which the correction rewrites (contract test) (**derived**) |
| A deleted set leaves the totals | `drizzle-statistics.repository.test.ts` "leaves out a set that was deleted" |
| A deleted workout leaves the week | Workouts and trained days come from `workout_session`, which is removed (**derived**, see above) |

### app-shell
| Scenario | Evidence |
|---|---|
| From Progress | `ProgressTabs` test |
| From Home | `HistoryLink` test, rendered in the Home container; `tab-bar.test.tsx` now pins `/statistics/history*` to Progress |
| From Profile | `profile-details.test.tsx` |

### responsive-ui
| Scenario | Evidence |
|---|---|
| Correcting a set is instant | `set-edits.queries.test.tsx` (patched before the server answers) |
| Deleting a set is instant | same file |
| Delete confirmed | `workout-detail.test.tsx` ("Deleting…" disabled); container navigates on success |
| Delete fails | `history.queries.test.tsx` (error state); `workout-detail.test.tsx` (alert, workout stays) |

## Warnings
1. There is no screen-level test that taps a done row in the full workout screen and gets the editor. Both halves are tested separately, and typecheck covers the wiring. DV.1 covers it.
2. Four scenarios rest on derived behaviour (session-based week and Last done, and last-time filtering), not on new tests written for this change.
3. `HistoryLink`'s RED step was not observed.
4. Device checks DV.1–DV.3 are pending, and the local stack must be rebuilt first. No migration is needed.

## Ready for archive
After the device checks.
