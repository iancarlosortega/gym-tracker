# Archive report — optimistic-ui-and-polish

Archived 2026-10-04. Verify verdict: **pass**, with one warning (W1).

## Specs synced to `openspec/specs/`
- `routines`, `app-shell` and `display-unit` were composed with `gentle-ai sdd-archive-compose`.
- `responsive-ui` is new and was copied.

## Final state
- Slices S1 to S8 are complete. The commits are listed in apply-progress.md.
- One fix was found during the device checks: full-width screens outside the tab bar (`0c5ebec`).
- Ian confirmed DV.1 to DV.5 on the iPhone.

## Follow-ups raised by Ian at close
- Drag to reorder for the exercises inside a routine.
- The routine editor's Done button looks off-style.
- An empty routine needs an "Add exercises" action without entering edit mode.
