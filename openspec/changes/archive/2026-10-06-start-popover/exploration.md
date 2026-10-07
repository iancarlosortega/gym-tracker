# Exploration: start-popover

## Question
The center + in the tab bar opens a bottom drawer for starting a workout. The owner wants the options to grow out of the + instead: a popover above the button with a caret pointing at it. Owner picked design F from https://claude.ai/artifact/GN8wUtVxdihJ4NjSzMxohs. What does that take, and what changes?

## Design F (owner pick, 2026-10-06)
- **Menu view.** A primary "Start <up next>" button with the subtitle "Up next · N exercises", then "Pick another routine" with a chevron, then "Empty workout".
- **Picker view.** "Pick another" slides the same popover sideways to the routine list; no second drawer opens. The picker view has:
  - a back header, "Start which routine?";
  - a search box, only when the user has 8 or more routines;
  - a list with a fixed maximum height that scrolls inside the popover; up next is pinned first and tagged, and each row shows name, exercise count and last done;
  - a message when no routine matches the search;
  - a "Manage routines" footer link to `/routines`.
- **Open state.** The + rotates to ×, a scrim dims the page, and Esc or a tap outside closes the popover.

## Current state
- **Tab bar.** `apps/web/src/features/shell/presentation/components/tab-bar.tsx`. While no workout is open, the center button is a `<button aria-label="Start a workout">` that calls `onStart`. While a workout is open, it is a link back to `/workout`; that stays as is.
- **Start flow.** `apps/web/src/features/shell/presentation/containers/app-shell.container.tsx` → `useStartSheets`:
  - State is `'menu' | 'picker' | null` and drives one base-ui `Drawer` (`components/ui/drawer.tsx`).
  - It renders `StartMenu` or `RoutinePicker` from `routines/presentation/components/start-sheets.tsx`.
  - `startWith(id?)` calls `start.mutate`, closes, then `router.push('/workout')`.
  - On error it shows "Could not start it. Try again once you're online."
- **Data is already all in memory.** `useRoutines()` → `getRoutines` fetches `/routines?limit=200` once, unarchived routines are filtered client-side, and `upNextRoutineId` comes with the listing. Each `ListedRoutineResponse` carries `entries` (so the exercise count is `entries.length`) and `lastDoneAt`.
- **Last-done helper.** `lastDoneLabel(lastDoneAt, now, timeZone)` already exists in `features/home/presentation/components/home-views.tsx`. To share it, it needs a neutral home, or the picker imports it from home.
- **UI primitives.** `@base-ui/react` 1.8.0 is installed and ships `popover` (Root/Trigger/Portal/Positioner/Popup/Arrow, side/align/sideOffset, the `--transform-origin` CSS var, focus management, Esc and outside-press dismiss). The only base-ui wrappers in `components/ui` today are drawer, button, input and separator, so there is no Popover wrapper yet.
- **Spec.** In `openspec/specs/app-shell/spec.md`, "The central action starts quickly" requires three choices: start suggested, pick a different, empty. That behaviour stays; its presentation changes and the long-list behaviour is new.
- **Tests.**
  - `tab-bar.test.tsx` and `start-sheets.test.tsx` are Vitest + Testing Library.
  - `workout-page.container.test.tsx` mentions the start choices.
  - The Home-row start (`RoutineStartChoices`) is a separate sheet and out of scope.

## Many routines: pagination vs scroll + search
The owner asked about infinite pagination. **Recommendation: no pagination.**
- The full list is already fetched in one request and cached.
- Paging it again would add loading states and requests without saving anything.
- The problem is the height on screen. A fixed max-height scroll area plus a search box (shown at 8 or more routines) covers it.
- The 200 cap in `getRoutines` is an existing limit that applies the same way to the Routines page. It is not this change's concern.

## Approaches
1. **base-ui Popover** (recommended).
   - Add a `components/ui/popover.tsx` wrapper in the same style as `drawer.tsx`.
   - The + becomes `Popover.Trigger`. `Positioner` uses `side="top"` and `align="center"`, and `Popover.Arrow` is the caret.
   - Focus trap, return focus, Esc and outside dismiss, `aria-expanded` and `aria-controls` all come for free.
   - The scrim is a sibling backdrop (`Popover.Backdrop`).
   - The two views are internal state in one Popup with a CSS translate.
2. **Custom absolute panel in the tab bar.** It needs no portal, but focus, dismiss and ARIA have to be rebuilt by hand. Rejected: more code and more a11y risk.

## Shape of the change (web only)
- **Popover wrapper.** Add `components/ui/popover.tsx`.
- **Presentational pieces in `routines/presentation/components/start-sheets.tsx`** (or split into a new start-popover file):
  - `StartMenu` gains the up-next subtitle;
  - a new `RoutinePicker` with search, scroll, the empty message and the Manage link;
  - a pure `filterRoutines(routines, query, upNextId)` (order with up next first, case-insensitive name match).
- **Shell.**
  - `TabBar` takes the popover trigger/content (or a render slot) instead of `onStart`.
  - `useStartSheets` swaps the Drawer for a `StartPopover` that holds the `menu | picker` view.
- **Motion.** The popup scales from `--transform-origin`, the + icon rotates 135°, and `prefers-reduced-motion` turns motion off.
- **Spec delta.** `app-shell` "The central action starts quickly" gets new scenarios:
  - the menu opens anchored to the + and the picker opens in place;
  - a long list scrolls within a bounded height;
  - search shows at 8 or more routines;
  - no match shows a message;
  - Manage routines goes to `/routines`;
  - Esc or an outside tap closes it.

## Risks
- **iOS Safari.** The popover sits above a fixed tab bar with a safe-area inset, so the positioner needs `collisionPadding` and the list max-height must fit small screens; the target is about 40vh.
- **Keyboard.** The search input autofocusing on iOS opens the keyboard and shifts the layout. Do not autofocus; focus the back header instead.
- **Scroll chaining.** The inner scroll needs `overscroll-behavior: contain` so the page does not scroll behind it.
- **Tests.** Base-ui Popover renders in a portal, so tests query by role from `screen`. Existing tests that find the Drawer's title "Start a workout" will change.
