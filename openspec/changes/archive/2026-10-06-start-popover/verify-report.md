# Verify report — start-popover

Verified inline on 2026-10-06 at `4f8fa46`. **Verdict: PASS with warnings** (1 requirement, 11 scenarios).

## Evidence
- `pnpm test`: web 549, api 336, domain 242, all passing.
- `pnpm --filter web typecheck`, `biome check .` and `pnpm --filter web build` all pass.
- Ian checked the popover position and the caret on his phone after the anchor fix ("perfect").

## Requirement: The central action starts quickly (MODIFIED)
| Scenario | Covered by | Result |
|---|---|---|
| Quick start of the suggested routine | `start-popover.test.tsx` "starts the routine up next…" (`onStart('r-2')`), container `startWith` → `/workout` | ✅ |
| Picking a different routine | `start-popover.test.tsx` "picks another routine in place…" (`onStart('r-1')`) | ✅ |
| Empty workout | `start-popover.test.tsx` (`onStart(undefined)`) | ✅ |
| The menu comes out of the central action | `aria-expanded="true"` asserted; the position above the + and the caret were seen on the device by Ian | ✅ |
| The picker opens in place | `start-popover.test.tsx` (picker and back in the same popover), `start-sheets.test.tsx` (up next first and tagged, "6 exercises · Last done Monday") | ✅ |
| A long list scrolls inside the popover | `max-h-[40dvh] overflow-y-auto overscroll-contain` on the list; no automated test (jsdom has no layout) | ⚠️ DV.2 |
| Search appears for many routines | `start-sheets.test.tsx` (search at `SEARCH_FROM`, case-insensitive filter) | ✅ |
| No search for a short list | `start-sheets.test.tsx` (`SEARCH_FROM - 1`) | ✅ |
| Nothing matches | `start-sheets.test.tsx` ("No routine matches that.") | ✅ |
| Managing routines from the picker | `start-sheets.test.tsx` (href `/routines`) | ✅ |
| Closing the menu | Escape is tested; outside tap and tapping the + again rely on base-ui dismissal | ⚠️ |

## Warnings
1. The bounded scroll is CSS only, so it is confirmed on the device only (DV.2, confirmed by Ian).
2. Closing by an outside tap or by tapping the + again is not covered by a test. Base-ui handles it; Ian closed it on the device.
3. "Manage routines" closing the popover (`onManage`) is wired but not asserted.
4. Leaving the picker unmounts it at once, so the slide back to the menu shows an empty panel for about 300ms. This is cosmetic.

## Tasks
W1 and W2 are complete. DV.1 is done (position and caret seen by Ian). DV.2 and DV.3 confirmed by Ian on the device (2026-10-06).
