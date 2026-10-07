# Tasks — start-popover

Strict TDD (red → green → refactor). Each unit is a commit to main once `pnpm test`, `pnpm typecheck`, `biome check .` and the web build pass, after Ian's local review. Units are sliced for the 400-line budget (auto-chain).

## W1 — Picker logic and views
- [x] 1.1 Move `lastDoneLabel` to `features/routines/presentation/last-done.ts` and re-import it in Home. Existing tests move with it and stay green.
- [x] 1.2 `pickableRoutines(routines, upNextId, query)` and `SEARCH_FROM = 8` (D3). Tests: up next first with the user's order kept, case-insensitive trimmed match, empty query, no match.
- [x] 1.3 `StartMenu`: the "Up next · N exercises" subtitle (singular for 1), the "Pick another routine" copy and a chevron. Update `start-sheets.test.tsx`.
- [x] 1.4 `RoutinePicker`:
  - back control;
  - search at `SEARCH_FROM` or more (never autofocused);
  - bounded scroll list with name, `UpNextTag` and "N ex · last done";
  - empty message;
  - "Manage routines" link.

  RTL tests cover search at 8 and not at 7, filtering, the empty message and the link href.

## W2 — Popover and shell
- [ ] 2.1 `components/ui/popover.tsx` wrapper (D1): backdrop, positioner side top with collision padding, arrow, scale from `--transform-origin`, reduced motion.
- [ ] 2.2 `StartPopover` (D2/D4): open and view state, sliding track with an `inert` inactive view, the view reset on close, the error message. RTL: open → choices, each choice → `onStart(id?)`, picker and back, Esc closes without starting.
- [ ] 2.3 `TabBar` takes a `startMenu` slot instead of `onStart`, and the + rotates on `aria-expanded` (D5). Update `tab-bar.test.tsx`.
- [ ] 2.4 `AppShellContainer`: `useStartPopover` replaces the Drawer. Same `startWith`, routines and up next, error, and mutation reset on close. Fix the affected container tests.
- [ ] 2.5 Bump `SHELL_CACHE` to `gym-shell-v8` (D6).

## Device verification
- [ ] DV.1 iPhone: tap + → the popover sits above the + with the caret pointing at it, × shows, the scrim dims the page, and tapping outside closes it.
- [ ] DV.2 Pick another → the list slides in place. With 8 or more routines, search filters and the keyboard does not cover the list badly. A long list scrolls without scrolling the page.
- [ ] DV.3 Start up next, another routine, and an empty workout: each opens the /workout route. While a workout is open, the center button returns to it.

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| W1 | ~280 |
| W2 | ~360 |

Chained PRs recommended: Yes (2 units, ~640 lines). 400-line budget risk: Low per unit. Decision needed before apply: No (auto-chain; commits to main, no PRs).
