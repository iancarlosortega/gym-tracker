# Design: start-popover

## D1 — base-ui Popover wrapper
`apps/web/src/components/ui/popover.tsx` wraps `@base-ui/react/popover` the same way `drawer.tsx` wraps the drawer: `Popover`, `PopoverTrigger`, `PopoverContent`.
- `PopoverContent` renders Portal → Backdrop (scrim) → Positioner (`side="top"`, `align="center"`, `sideOffset` about 14px, `collisionPadding` 12px) → Popup → Arrow.
- The popup's transform origin is base-ui's `--transform-origin`, so it scales out from the +.
- Enter and exit use base-ui's `data-starting-style` and `data-ending-style` attributes; `motion-reduce:` removes the transitions.
- Base-ui supplies the dismissal (Esc, outside press, trigger toggle), focus return and `aria-expanded`.

Rejected: a custom absolutely positioned panel. It would rebuild focus, dismissal and ARIA by hand.

## D2 — Who owns what
- `TabBar` (presentational) keeps the `workoutOpen` link branch. In the start branch it renders `startMenu: ReactNode` in the center slot instead of calling `onStart`. The container passes `<StartPopover … />`, so the trigger and its content stay together and `TabBar` does not learn popover state. The `onStart` prop is removed.
- `StartPopover` (presentational, `features/shell/presentation/components/start-popover.tsx`) owns `open` and `view: 'menu' | 'picker'`. Closing resets the view to `menu`. Its props are:
  - `upNext`;
  - `routines`;
  - `starting`;
  - `error`;
  - `now`;
  - `timeZone`;
  - `onStart(routineId?)`;
  - `onOpenChange` (so the container can reset the mutation).
- `AppShellContainer` / `useStartSheets` becomes `useStartPopover`: the same `startWith` (mutate, close, push `/workout`), the same routines and up-next derivation, and the Drawer goes away.

## D3 — Picker logic is a pure function
In `routines/presentation/components/start-sheets.tsx` (or `routines/application` if a non-UI home fits better; follow the existing placement):
```ts
pickableRoutines(routines, upNextId, query): readonly PickableRoutine[]
```
- It keeps the user's order, with up next moved first.
- It matches names case-insensitively after a trim.
- An empty query returns everything.

`SEARCH_FROM = 8` is exported next to it.

## D4 — Views
- **`StartMenu`.** The primary button reads "Start <name>" with the subtitle "Up next · N exercises", where N is `entries.length`, singular for 1. The rows are "Pick another routine" with a chevron (shown when there are routines) and "Empty workout". The copy "Pick a different routine" becomes "Pick another routine".
- **`RoutinePicker`.** It has:
  - a back button that announces "Start which routine?" (the popup's title);
  - the search `<input type="search">`, labelled "Find a routine" and never autofocused, shown when there are `SEARCH_FROM` or more routines;
  - a scroll region (`max-h-[40dvh] overflow-y-auto overscroll-contain`) holding a `ul` of buttons with name, an `UpNextTag` and the meta "N ex · <lastDoneLabel>";
  - the empty message "No routine matches that.";
  - a "Manage routines" `Link` to `/routines` that closes the popover.
- **Sliding between views.** Both views stay mounted in a two-column track translated by `view`. The inactive view is `inert`, so focus and the screen reader skip it. The popup height animates through a measured height, or simply via the `grid-template-rows` trick; the simplest robust choice wins at apply time.
- **`lastDoneLabel`** moves from `features/home/presentation/components/home-views.tsx` to a shared spot (`features/routines/presentation/last-done.ts`). Home re-imports it, and its behaviour does not change.

## D5 — The + affordance
The trigger keeps `aria-label="Start a workout"`. The Plus icon rotates 135° when `aria-expanded="true"` (`group-aria-expanded:rotate-[135deg]`, `motion-reduce:transition-none`). The scrim sits behind the tab bar and the popup. The tab bar stays visible.

## D6 — Service worker
Bump `SHELL_CACHE` in `apps/web/public/sw.js` (`gym-shell-v7` → `v8`) so installed PWAs pick up the new shell.

## Testing (strict TDD)
- `pickableRoutines`: order, case, trim, empty query, no match.
- `start-popover.test.tsx` (RTL):
  - opening shows the three choices;
  - each choice calls `onStart` with the right id;
  - picker navigation and back;
  - search shown at 8 routines and not at 7;
  - filtering and the empty message;
  - the Manage link's href;
  - Esc closes.
- Update `tab-bar.test.tsx` for the `startMenu` slot, and `start-sheets.test.tsx` for the new copy and meta.
