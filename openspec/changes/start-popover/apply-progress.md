# Apply progress — start-popover

## W1 — Picker logic and views (applied 2026-10-06, uncommitted, awaiting Ian's review)
- 1.1 `lastDoneLabel` moved to `apps/web/src/features/routines/presentation/last-done.ts` (+ `last-done.test.ts`); Home re-imports it. Behaviour unchanged.
- 1.2 `pickableRoutines` + `SEARCH_FROM = 8` in `start-sheets.tsx`.
- 1.3 `StartMenu`: "Up next · N exercises" subtitle, "Pick another routine" + chevron, ghost rows. `StartableRoutine` type (id, name, entries, lastDoneAt) is satisfied by `ListedRoutineResponse` structurally.
- 1.4 `RoutinePicker`: Back icon button, "Start which routine?", search at ≥ 8 (no autofocus), `max-h-[40dvh]` scroll with `overscroll-contain`, "N exercises · Last done …" meta, "No routine matches that.", "Manage routines" link (`onManage` closes).
- Bridge: `app-shell.container.tsx` passes `now`, `timeZone`, `onBack`, `onManage` to the still-drawer-based picker so W1 builds alone. W2 replaces the drawer.

Evidence: `pnpm test` (web 543, api 336, domain 242), `pnpm --filter web typecheck`, `biome check .`, `pnpm --filter web build` all green.

Runtime ledger: W1 attempt 1 settled `passed`; changed lines 433 > 400 budget (the moved `lastDoneLabel` counts as delete + add). The ledger needs a maintainer reset before W2 can open.
