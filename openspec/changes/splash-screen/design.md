# Design: splash-screen

Design E, "Rise and dock", from https://claude.ai/artifact/11LG3Pwqg4uye8eWgkgifD (artboard `E-RiseDock.dc.html` is the motion reference: timings, easings and sizes below are taken from it).

## D1 — iOS launch images from one table
- `apps/web/src/features/splash/launch-images.ts` exports `LAUNCH_SIZES`: `{ width, height, ratio }` in CSS px, portrait. It also exports a pure function `startupImages()` that returns Next's `appleWebApp.startupImage` entries:
  - `url`: `/splash/launch-{W}x{H}.png`, in device pixels;
  - `media`: `(device-width: Wpx) and (device-height: Hpx) and (-webkit-device-pixel-ratio: R) and (orientation: portrait)`.
- `layout.tsx` sets `appleWebApp.startupImage: startupImages()`, using Next metadata rather than hand-written `<link>`s.
- **Generator.** `apps/web/scripts/launch-images.mts` reads `LAUNCH_SIZES`. For each size it:
  1. writes the launch-frame SVG: an amber `#f2b544` full bleed and the icon's dumbbell group, centered in a box of 300 CSS px × ratio, which is the same geometry as the overlay's art box;
  2. rasterizes it with `magick` to `public/splash/`.

  It is a dev-only, run-once tool. The PNGs are committed, and CI never runs it.
- Sizes (verify against current Apple specs at apply time; adjust the table only):

| CSS w×h | ratio | iPhones |
|---|---|---|
| 375×667 | 2 | SE 2nd/3rd gen, 8 |
| 375×812 | 3 | X, XS, 11 Pro, 12/13 mini |
| 414×896 | 2 | XR, 11 |
| 414×896 | 3 | XS Max, 11 Pro Max |
| 390×844 | 3 | 12, 13, 14, 16e |
| 428×926 | 3 | 12/13 Pro Max, 14 Plus |
| 393×852 | 3 | 14 Pro, 15, 15 Pro, 16 |
| 430×932 | 3 | 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus |
| 402×874 | 3 | 16 Pro, 17, 17 Pro |
| 420×912 | 3 | Air |
| 440×956 | 3 | 16 Pro Max, 17 Pro Max |

- The manifest `background_color` stays `#f2b544`, so Android's generated splash matches.

## D2 — Overlay is server-painted, client-driven
- `features/splash/presentation/components/splash-screen.tsx` is presentational and has no hooks. It renders `<div class="splash" aria-hidden data-phase={phase} style={vars}>` with a tile wrapper and the icon art SVG: seven `.splash-bar` rects plus the `.splash-lift` dumbbell group, the same geometry as `public/icon.svg`.
- `features/splash/presentation/containers/splash.container.tsx` is `'use client'`. Its phase is `'rise' | 'dock' | 'vanish' | 'fade' | 'done'`, and at `done` it renders `null`.
- It is mounted in the root `layout.tsx` body, before `<Providers>`. Because the root layout stays mounted across client navigations, the overlay plays once per document load. That gives the cold-start-only behaviour without any storage.
- **Standalone only, decided by CSS before hydration.** `.splash{display:none}` and `@media (display-mode: standalone){.splash{display:block}}`. On mount the container checks `matchMedia('(display-mode: standalone)')`; when it does not match, it goes straight to `done`.

## D3 — Phases and timing (k = 1)
| Phase | Driver | What |
|---|---|---|
| rise | CSS from first paint | Bars `scaleY 0→1`, 380ms `cubic-bezier(.34,1.56,.64,1)`, delays 120 + 55·i ms. Lift: 420ms, −16px at 45%, delay 500ms. |
| dock | container | At max(hydration, 950ms after `performance.timeOrigin`), measure `[data-splash-dock]`. Set `--dock-x`, `--dock-y` (target centre) and `--dock-scale` (target width / 112), then `data-phase="dock"`. Keyframes `splash-morph`, 850ms: 0→50% `clip-path: inset(calc(50% - 56px) calc(50% - 56px) round 26px)` while the art scales to `.3733`; 50→100% `translate(var(--dock-x) - 50vw, var(--dock-y) - 50vh) scale(var(--dock-scale))`, radius 56px; then a 120ms fade. |
| vanish | container | No dock target: the same contraction to the tile, then `scale(.8)` and fade, 300ms. |
| fade | container | `prefers-reduced-motion: reduce`: the overlay fades over 200ms. In CSS, bars and lift have no animation under reduced motion. |
| done | container | Reached on `animationend` of the final animation, with a `setTimeout` safety of 1200ms; the overlay unmounts. |

- **Hard cap without JavaScript.** `.splash:not([data-phase]) { animation: splash-cap 200ms linear 3s forwards }` takes it to `opacity:0; visibility:hidden`. Once the container sets a phase, the cap no longer applies.
- **Taps.** `pointer-events:none` from `dock` onwards. During rise the overlay swallows taps, which is at most ~1s.

## D4 — Dock targets
- The `data-splash-dock` attribute goes on the start `PopoverTrigger` circle (`start-popover.tsx`) and on the back-to-workout circle `span` (`tab-bar.tsx`). Both are `size-16` circles.
- The tile lands as a circle of the target's size and then fades. The + is `bg-primary`, not amber, so the hand-off is a 120ms crossfade onto the real button, as in the artboard.

## D5 — Styles live in globals.css
The keyframes and the `.splash*` rules go in a `/* Splash */` section of `globals.css`. They must apply before hydration, and Tailwind arbitrary animations would scatter seven keyframes across class strings. The colours are literal icon colours (`#f2b544`, `#dc9c2c`, `#141418`), not theme tokens, because the splash *is* the icon.

## D6 — Service worker
Bump `SHELL_CACHE` to `gym-shell-v9`, because the cached shell HTML changes (overlay markup and startup-image links). The launch PNGs are not precached: iOS fetches them at install and launch through its own cache.

## Testing (strict TDD)
- `launch-images.test.ts`: every table row produces a url and media string of the exact format, with no duplicate media.
- `splash.container.test.tsx`, with fake timers and `matchMedia` stubs:
  - not standalone → nothing rendered after mount;
  - standalone with a dock target → after 950ms, `data-phase="dock"` with vars from a stubbed `getBoundingClientRect`;
  - no target → `vanish`;
  - reduced motion → `fade`;
  - `animationend` or the safety timeout → unmounted;
  - a re-render (navigation) does not replay.
- `splash-screen.test.tsx`: aria-hidden, seven bars, phase attribute.
- Not testable in jsdom: the actual motion and the iOS launch-image match. These are covered by DV.1–DV.3.
