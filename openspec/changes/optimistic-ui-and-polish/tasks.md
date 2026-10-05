# Tasks — optimistic-ui-and-polish

Strict TDD. Each unit is green before it is handed over: tests, typecheck, biome and build. Ian reviews each unit locally before it is committed to main. There are no PRs.

## S1 — Optimistic core + unit switch
- [x] 1.1 `lib/optimistic.ts` (D1).
  - Hook tests with a real `QueryClient` and deferred `mutationFn`s cover: the patch is applied before the call resolves; it rolls back on error when the mutation is the only one pending; when several are pending, an earlier error does not undo later edits; it invalidates once, only after the last one settles; a shared `scope` runs the calls in tap order.
- [x] 1.2 `RollbackNotice` atom and `useRollbackNotice`. Tests: "Not saved." plus Try again re-sends the same variables.
- [x] 1.3 `useChangeDisplayUnit` built on the helper (scope `display-unit`). Profile shows the change at once and shows the notice on failure. Tests: the radio moves before the server answers, and lb→kg quickly ends on kg.

## S2 — Optimistic routines + catalog
- [x] 2.1 Routine rename and archive (D2).
- [x] 2.2 Entry change, remove and reorder. The up/down buttons are no longer disabled while pending, and rapid moves keep their order.
- [x] 2.3 Catalog exercise and equipment rename and archive.
- [x] 2.4 Creates show pending and block double submits. Check every create form for this, and add it where it is missing.

## S3 — Service worker v4
- [ ] 3.1 Cross-origin requests are not handled. Navigation preload is enabled. The cache is `gym-shell-v4` and `v3` is deleted (D8). Covered by `sw.test.ts`.
- [ ] 3.2 Network-first with a 3 s timeout: a cached copy is served when the network is late and the cache is updated afterwards; with no cached copy, the SW waits for the network. Covered by `sw.test.ts`.

## S4 — Session in the Query cache + start navigates first
- [ ] 4.1 Key factory entries `current`, `sessionSets(id)` and `start`. `sessionSetsQuery` merges server and queue sets with `networkMode: 'always'` and falls back to the queue offline (D4). Tests use fake-indexeddb.
- [ ] 4.2 `workout-page.container` moves onto queries. Port the existing container test first; its assertions stay green.
- [ ] 4.3 The workout screen writes logged rows into `sessionSetsQuery` and invalidates after the drain. The existing offline-logging tests stay green.
- [ ] 4.4 Start navigates first. The workout page has a starting state, plus a failed state with Try again. The raw `startWorkout()` is replaced (D3).

## S5 — Home headline
- [ ] 5.1 `sessionProgress` pure function, tested on target, no target, extra exercises and queued sets.
- [ ] 5.2 `HomeHeadline` gets an open variant ("Push day, 3 of 5 done" / "Workout in progress") linking to `/workout`. The container is wired up, with view tests.

## S6 — Routine order: domain, migration, API
- [ ] 6.1 Domain: `position` on Routine, the `reorderRoutines` rule, and `RoutineOrderMismatchError` (D6).
- [ ] 6.2 Migration `0002_routine_position.sql` with an alphabetical backfill per user. Update the schema. The SQL test covers the backfill order and `NOT NULL`.
- [ ] 6.3 Create puts the new routine last. The list sorts by position. Up-next uses the real position.
- [ ] 6.4 `PUT /routines/order` returns 204, or 409 on an id mismatch. The view exposes `position`. Covered by API tests.

## S7 — Routine order: web
- [ ] 7.1 `reorderRoutines` api function and the optimistic `useReorderRoutines` (scope `routine-order`).
- [ ] 7.2 Add `@dnd-kit/core` + `@dnd-kit/sortable`. Make `RoutineCards` sortable from the handle: touch delay 250 ms / tolerance 5, keyboard sensor, announcements (D6).
- [ ] 7.3 Move up and Move down per row. Tests cover the move actions and that the order persists in the cache.

## S8 — Units in Progress + Recompute
- [ ] 8.1 Progression container and chart: values converted, unit in the label, caption and weekly list (D7).
- [ ] 8.2 Recompute: records and set changes show the unit on both sides.

## Device verification (Ian, iPhone)
- [ ] DV.1 The lb/kg switch is instant. Try it in airplane mode: the choice stays, then syncs.
- [ ] DV.2 Routine drag by the handle works with no text callout, and scrolling a row does not drag. Move up/down works with VoiceOver off and on.
- [ ] DV.3 On a weak connection, tab switches do not hang. After deploying, the app picks up the new build.
- [ ] DV.4 Start opens the workout screen at once. With a workout open, Home reads "<routine>, n of m done".
- [ ] DV.5 Progress and the recompute preview read lb.

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| S1 | ~300 |
| S2 | ~350 |
| S3 | ~200 |
| S4 | ~400 |
| S5 | ~180 |
| S6 | ~350 |
| S7 | ~350 |
| S8 | ~150 |

- Total: about 2,300 lines.
- Chained PRs recommended: Yes. The 400-line budget risk is Low per unit, since every unit is at or under 400.
- Delivery: auto-chain, one commit series per unit on main after Ian's local review.
- Decision needed before apply: No.
