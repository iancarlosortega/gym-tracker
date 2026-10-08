# Apply progress — splash-screen

## W1 — iOS launch images (applied 2026-10-08, uncommitted, awaiting Ian's review)
- 1.1 `apps/web/src/features/splash/launch-images.ts`: `LAUNCH_SIZES` (11 portrait iPhone sizes, including the Air at 420×912@3 added to the design table during apply), `launchImagePath`, `startupImages()`. Tests are in `launch-images.test.ts` (4): red, then green.
- 1.2 `apps/web/scripts/launch-images.mts`: Node type-stripping script (`node scripts/launch-images.mts`). It renders the amber frame with the dumbbell centred in a 300px art box through `magick`. Its output is 11 PNGs in `public/splash/` (124 KB total), and a preview was checked by eye. The `.mts` extension avoids Node's module-type warning, since the package is not `"type": "module"`.
- 1.3 `layout.tsx`: `appleWebApp.startupImage: startupImages()`. The build renders 11 `<link rel="apple-touch-startup-image" media=…>` tags.

Evidence:
- `pnpm test` (web): 93 files, 553 tests passed.
- `pnpm typecheck`: clean.
- `biome check` on the changed paths: clean.
- `pnpm build`: ok.
- Runtime ledger: W1 settled as passed (state `complete`).

## W1 committed
`db45ca7` feat(web): iOS launch images for the installed app.

## W2 — Splash overlay (applied 2026-10-08, uncommitted, awaiting Ian's review)
- 2.1 `globals.css` Splash section: standalone-only display, the rise, lift, shrink, morph, vanish and out keyframes, the 3s cap on `:not([data-phase])`, and reduced motion.
- 2.2 `SplashScreen` (presentational) with 4 RTL tests.
- 2.3 `SplashContainer`, with 9 tests on fake timers and stubbed `matchMedia` and `performance.now`.
  - **Deviation from D3:** the closing phases end on timers that match the CSS durations (dock 1000ms, vanish 750ms, fade 220ms), not on `animationend`. jsdom cannot deliver an `animationName`, and the timers are deterministic. A target of width 0 counts as no target.
- 2.4 `data-splash-dock` on the start trigger and on the back-to-workout circle, each with one new test.
- 2.5 Mounted in the root layout, before Providers. `SHELL_CACHE` is now `gym-shell-v9`.

Evidence:
- `pnpm test` (web): 95 files, 568 tests passed.
- `pnpm typecheck`: clean.
- `biome check .`: clean.
- `pnpm build`: ok, and the overlay is in the prerendered HTML.

Ledger: the settle is **blocked** by the changed-line budget. The diff is about 515 lines against a 400 budget (the forecast was about 340). It is mostly the 179-line CSS section and 175 lines of tests. Ian accepted the size ("I'm the only developer"); the ledger was reset with actor ian on 2026-10-08.
