# Tasks — splash-screen

Strict TDD (red → green → refactor). Each unit is a commit to main once `pnpm test`, `pnpm typecheck`, `biome check .` and the web build pass, after Ian's local review. Units are sliced for the 400-line budget (auto-chain).

## W1 — iOS launch images
- [x] 1.1 `features/splash/launch-images.ts`: `LAUNCH_SIZES` and `startupImages()` (D1). Tests first: exact url and media format per row, unique media, portrait only.
- [x] 1.2 `apps/web/scripts/launch-images.mts` generator: launch-frame SVG per size → `magick` → `public/splash/launch-{W}x{H}.png`. Verify the size table against current Apple specs and run it once. Commit the PNGs.
- [x] 1.3 `layout.tsx`: `appleWebApp.startupImage: startupImages()`.

## W2 — Splash overlay
- [ ] 2.1 `globals.css` Splash section (D3/D5): `.splash` standalone-only display, rise and lift keyframes, `splash-morph`, vanish, fade, the cap, and reduced motion.
- [ ] 2.2 `SplashScreen` presentational component (D2): tile wrapper, icon art, `data-phase`, CSS vars. RTL tests first.
- [ ] 2.3 `SplashContainer` (D2/D3): standalone and reduced-motion checks, the 950ms gate, dock-target measure, phase transitions, and `animationend` plus safety-timeout unmount. Tests first (see the design's Testing section).
- [ ] 2.4 `data-splash-dock` on the start + trigger and the back-to-workout circle (D4). Update the tab-bar and start-popover tests if they snapshot attributes.
- [ ] 2.5 Mount `SplashContainer` in the root layout. Bump `SHELL_CACHE` to `gym-shell-v9` (D6).

## Device verification
- [ ] DV.1 iPhone, installed app, cold start: the system launch shows amber with the dumbbell, and the web splash continues on the same frame with no cut, blank or jump.
- [ ] DV.2 Signed in on Home: the bars rise, the dumbbell reps, the screen shrinks to the tile and docks into the +, and the app is usable after about 2s. With a workout open, it docks into the back-to-workout button. Signed out (sign-in): the tile fades in place.
- [ ] DV.3 Navigating between tabs never replays it. In Safari (not installed) there is no splash. With Reduce Motion on, it is a plain fade.

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| W1 | ~140 (+10 PNGs) |
| W2 | ~340 |

Chained PRs recommended: Yes (2 units, ~480 lines). 400-line budget risk: Low per unit. Decision needed before apply: No (auto-chain; commits to main, no PRs).
