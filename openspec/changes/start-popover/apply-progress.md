# Apply progress — start-popover

## W1 — Picker logic and views (applied 2026-10-06, uncommitted, awaiting Ian's review)
- 1.1 `lastDoneLabel` moved to `apps/web/src/features/routines/presentation/last-done.ts` (+ `last-done.test.ts`); Home re-imports it. Behaviour unchanged.
- 1.2 `pickableRoutines` + `SEARCH_FROM = 8` in `start-sheets.tsx`.
- 1.3 `StartMenu`: "Up next · N exercises" subtitle, "Pick another routine" + chevron, ghost rows. `StartableRoutine` type (id, name, entries, lastDoneAt) is satisfied by `ListedRoutineResponse` structurally.
- 1.4 `RoutinePicker`: Back icon button, "Start which routine?", search at ≥ 8 (no autofocus), `max-h-[40dvh]` scroll with `overscroll-contain`, "N exercises · Last done …" meta, "No routine matches that.", "Manage routines" link (`onManage` closes).
- Bridge: `app-shell.container.tsx` passes `now`, `timeZone`, `onBack`, `onManage` to the still-drawer-based picker so W1 builds alone. W2 replaces the drawer.

Evidence: `pnpm test` (web 543, api 336, domain 242), `pnpm --filter web typecheck`, `biome check .`, `pnpm --filter web build` all green.

Runtime ledger: W1 attempt 1 settled `passed`; changed lines 433 > 400 budget (the moved `lastDoneLabel` counts as delete + add). The ledger needs a maintainer reset before W2 can open.

W1 approved by Ian and committed as 9c8a760. Ledger reset by Ian (actor ian) to open W2.

## W2 — Popover and shell (applied 2026-10-06; Ian approved after the anchor/caret fix)
- 2.1 `apps/web/src/components/ui/popover.tsx`: Popover, PopoverTrigger, PopoverTitle, PopoverContent (Portal → Backdrop z-30 under the z-40 tab bar → Positioner side top, offset 14, collision padding 12 → Popup scaling from `--transform-origin` → Arrow). Reduced motion turns transitions off.
- 2.2 `StartPopover` (`features/shell/presentation/components/start-popover.tsx`): owns open + view, sliding two-column track with `inert` on the hidden view, picker mounted only while shown, view reset in `onOpenChange` completion, failed-start alert. Choosing closes and calls `onStart(id?)`.
- 2.3 `TabBar` takes `startMenu: ReactNode` instead of `onStart`; the Plus rotates 135° on `aria-expanded`.
- 2.4 `app-shell.container.tsx`: `useStartPopover` replaces the Drawer and returns the `StartPopover` element; same start, routines and up-next derivation; `start.reset()` on open change.
- 2.5 `SHELL_CACHE` → `gym-shell-v8`.

Evidence: `pnpm test` (web 549, api 336, domain 242), `pnpm --filter web typecheck`, `biome check .`, `pnpm --filter web build` all green. Not yet seen on a device (DV.1–DV.3 pending).
- Fix after Ian's device check: the trigger is now the circle itself (it was a span with -mt-6 inside the button, so the anchor sat ~24px low and the popup overlapped the +), and the clipping moved from the popup to an inner wrapper so the caret is no longer hidden.
