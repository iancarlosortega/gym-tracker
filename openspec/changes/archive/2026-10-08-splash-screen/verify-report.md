# Verify report — splash-screen

Verified inline on 2026-10-08 at `81087f6`. **Verdict: PASS with warnings.** 1 requirement and 7 scenarios checked.

## Gates
- `pnpm test` (web): 95 files, 568 tests passed.
- `pnpm typecheck`: clean.
- `biome check .`: clean.
- `pnpm build`: ok.
  - 11 `apple-touch-startup-image` links render.
  - The overlay markup is in the prerendered HTML.

## Tasks
W1 1.1–1.3 and W2 2.1–2.5 are complete. DV.1–DV.3 are pending on the device.

## Spec: "The installed app opens with a branded launch"
| Scenario | Evidence | Status |
|---|---|---|
| Native launch hands off seamlessly | The launch PNGs use the same geometry as `.splash-art` (a 300px centred box, launch-images.mts and globals.css). `launch-images.test.ts` covers url and media. | Static ✓, DV.1 pending |
| Launch docks into the central action | Container test "docks into the central action…" (vars from the target rect), "is gone once the tile has handed off". Dock markers are covered by the tab-bar and start-popover tests. | ✓ (motion: DV.2) |
| No tab bar to dock into | "vanishes in place…", "treats an invisible target as no target" | ✓ (DV.2) |
| Reduced motion | "only fades when the device asks for less motion". The CSS `prefers-reduced-motion` block removes the rise and the rep. | ✓ (DV.3) |
| Navigating does not replay it | "does not replay when the layout re-renders"; it is mounted in the root layout. | ✓ (DV.3) |
| Browser tab has no launch | "gets out of the way in a browser tab". The CSS shows it only for `display-mode: standalone`. | ✓ (DV.3) |
| The launch never traps the app | `.splash:not([data-phase])` cap at 3s (CSS); closing timers in the container. | CSS only, untested in jsdom |

## Warnings
- **W1. Motion is not checked by any test.** Keyframes, clip-path, the transform morph and the iOS launch-image match need the device: DV.1–DV.3.
- **W2. Deviation from design D3.** The closing phases end on timers that mirror the CSS durations, not on `animationend`. If the CSS durations change, the `CLOSING_MS` constants in `splash.container.tsx` must change with them.
- **W3. The hand-off is a crossfade.** The + is `bg-primary`, not amber, so the tile crossfades onto it, as the design notes.
- **W4. Over the line budget.** W2 was about 515 lines against 400. Ian accepted it and the ledger was reset (actor ian).
