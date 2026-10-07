# Archive report — start-popover

Archived 2026-10-06.

## Final state
- Plan `336912f`, W1 `9c8a760` (routine picker with search, scroll and last-done meta), W2 `4f8fa46` (start menu pops out of the + button, including the anchor and caret fix after Ian's device check).
- Verify: PASS with warnings (1 requirement, 11 scenarios). Ian confirmed DV.1–DV.3 on the device (2026-10-06).
- Runtime ledger: both units ran over the 400-line budget (433 and 431, counting the moved `lastDoneLabel`, tests and docs); Ian reset it each time (actor ian).

## Specs composed
- `app-shell`: "The central action starts quickly" was replaced by the modified requirement. It covers the popover anchored to the +, the picker in place, the bounded scroll, search at 8 or more routines, the no-match message, Manage routines, and closing.

## Follow-ups (from the verify warnings)
- Tests for closing by an outside tap or by tapping the + again, and for Manage routines closing the popover.
- Keep the picker mounted while it slides back to the menu, so the slide never shows an empty panel.
