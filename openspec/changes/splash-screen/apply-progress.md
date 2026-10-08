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

## W2 — Splash overlay
Pending.
