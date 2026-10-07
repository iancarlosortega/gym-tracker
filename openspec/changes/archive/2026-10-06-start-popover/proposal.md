# Proposal: Start popover

## Intent
Today the center + opens a bottom drawer, and "Pick a different routine" swaps it to a second list. Ian wants the choices to grow out of the + instead, so the menu reads as coming from the button: a popover above it with a caret pointing at it (design F, https://claude.ai/artifact/GN8wUtVxdihJ4NjSzMxohs). The routine picker must stay usable with many routines.

## Scope
### In Scope
- **Popover anchored to the +.** It sits above the button with a caret pointing at it, scales out from the button, and a scrim dims the page. The + icon turns into a close icon. Esc, a tap outside, or the + again closes it, and focus returns to the +.
- **Menu view.**
  - "Start <up next>" with the subtitle "Up next · N exercises";
  - "Pick another routine";
  - "Empty workout".
  - With no up-next routine, only "Empty workout" and "Pick another routine" show (the latter only when there are routines).
- **Picker view inside the same popover**, reached by sliding sideways. It has:
  - a back control, "Start which routine?";
  - a list with a bounded height that scrolls inside the popover; up next is pinned first and tagged, and each row shows name, exercise count and last done;
  - a search box once the user has 8 or more routines, matching names case-insensitively, with a message when nothing matches;
  - a "Manage routines" link to `/routines`.
- **Behaviour kept.** A choice starts at once, opens `/workout` and shows the offline error message. While a workout is open, the center button still links to `/workout`.
- **Motion.** All of it respects `prefers-reduced-motion`.

### Out of Scope
- **Pagination.** All routines are already loaded in one request (owner decision, 2026-10-06: scroll + search instead).
- The Home-row "Start / See the plan" sheet.
- API changes.

## Capabilities
### Modified Capabilities
- `app-shell`: "The central action starts quickly" now describes the popover from the +, the picker in place, the long-list behaviour (bounded scroll, search at 8 or more, no-match message, Manage routines) and how it is dismissed.

## Approach
Approach 1 from the exploration:
- Add a `components/ui/popover.tsx` wrapper over `@base-ui/react/popover` (Trigger, Backdrop, Positioner `side="top"`, Popup, Arrow), styled like the existing drawer wrapper.
- A `StartPopover` holds the `menu | picker` view state.
- `RoutinePicker` gains search and a scroll area, driven by a pure `pickableRoutines(routines, upNextId, query)`.
- `TabBar` renders the trigger, and `AppShellContainer` owns the starting logic as it does today.

## Risks
- **Small screens and iOS Safari.** The positioner collision padding and a list max-height of about 40dvh keep the popup on screen above the fixed tab bar.
- **iOS keyboard.** The search box is never autofocused, so the keyboard does not pop up and shift the layout.
- **Test churn.** Tests that find the drawer title change to role queries on the popover.

## Owner decisions
- Design variant: **F**, caret card with the inline picker (Ian, 2026-10-06).
- Long list: **scroll + search**, with search at 8 or more routines, a bounded height and a Manage routines link (Ian, 2026-10-06).
- Defaults the orchestrator chose; Ian can override them at review: list max-height about 40dvh, search threshold 8, no autofocus on search.
