# Apply progress — optimistic-ui-and-polish

Applied 2026-10-04, inline in the parent session: the runtime refuses `sdd-*` sub-agents. Strict TDD for every unit. Each unit is committed to main once its tests, typecheck, biome and build are green. Ian authorised committing without review.

| Unit | Commit | Notes |
|---|---|---|
| S1 optimistic core + unit switch | `e31339d` | `lib/optimistic.ts` and `RollbackNotice`. 455 lines, over the 400 budget because of tests; the ledger was reset with actor ian. |
| S2 routines + catalog | `f5f8afe` | Sheets close on the tap; inline notice on failure. Routine archive still navigates on success (patch applied at once). Creates were already pending/disabled. |
| S3 service worker v4 | `35b816b` | Cross-origin requests skipped, navigation preload, 3 s network timeout with cache fallback, `gym-shell-v4`. |
| S4 session in the Query cache + instant start | `df252bd` | `useStartingWorkout` via `useMutationState`. `current` is disabled while a start is pending, so a stale "no workout" cannot win. |
| S5 Home headline | `e4af542` | `sessionProgress`; "X in progress" when the routine has no exercises. |
| S6 routine order backend | `048e0bc`, `685a885` | Migration `0002_routine_position.sql` with backfill; `PUT /routines/order` returns 204 or 409 (`ROUTINES_ORDER_MISMATCH`). |
| S7 routine order web | `d1276c0` | dnd-kit core/sortable/utilities; handle plus Move up/down. |
| S8 units in Progress + Recompute | `9adcb8e` | Both sides of a recompute change now name the unit. |

## Deviations from design
- **D4:** the workout screen keeps its pending count locally. The done list moved into `sessionSetsQuery`, and a logged row is written into that cache with `setQueryData`. `sessionSetsQuery` resolves the default queue lazily, so the server render never opens IndexedDB.
- **D6:** a new error code, `ROUTINES_ORDER_MISMATCH`, maps to 409. The existing `INVALID_ROUTINE_ORDER` stays for entry reorders. The rename and archive scope is one `routine` scope rather than one scope per routine.
- **D6:** the sensors are `MouseSensor` + `TouchSensor` + `KeyboardSensor` (the v6 API) rather than a single PointerSensor. The card renderer is injected into `SortableRoutineList` to avoid an import cycle.
- **Test fixes:** the migration test runs with a 30 s timeout, because PGlite boots slowly under the parallel workspace run.

## Final checks
- `pnpm test`: domain 220, api 263 and web 428 tests passed.
- `pnpm typecheck` and `biome check .` are clean. `next build` and the api build pass.

## Pending
- Device checks DV.1–DV.5, by Ian on the iPhone.
- Migration 0002 must run on the deployed database (`pnpm --filter ./apps/api db:migrate`) before the new API serves.
