# Exploration: splash-screen

## Question
The installed PWA opens straight onto whatever the first route paints. The owner wants a branded splash screen with defined animations, designed first in an artifact. What can a PWA actually show at launch, and where does an animated splash live?

## Platform facts
- **iOS (primary device).** A home-screen web app shows a static launch image only when `<link rel="apple-touch-startup-image">` is present for the exact device size and orientation; otherwise it shows a blank screen in the manifest/background colour. The image cannot animate. One PNG per device class (media query on device-width/height/pixel-ratio).
- **Android/Chrome.** Generates its own splash from manifest `name`, `background_color` (#f2b544) and the largest icon. Not customisable beyond that and not animatable.
- **Consequence.** An animated splash must be an in-app overlay rendered by the web app itself. The native launch image is the first frame; the in-app overlay must start on a pixel-identical frame so the handoff is invisible, then animate out.

## Current state
- Manifest `apps/web/public/manifest.webmanifest`: `background_color #f2b544` (icon amber), `theme_color #101014`, `display standalone`, portrait.
- Root layout `apps/web/src/app/layout.tsx`: `appleWebApp.capable`, `statusBarStyle black-translucent`, `viewportFit cover`, `dark` class, body `bg-background`. No `apple-touch-startup-image` links, so iOS currently shows a blank launch.
- Icon `apps/web/public/icon.svg` (owner pick 2026-10-06): amber #f2b544 square, seven week bars #dc9c2c rising Mon→Sun, near-black #141418 dumbbell rotated -45° and scaled 1.14. Layers are separate rects, so they can animate independently in SVG/CSS.
- Providers are a plain QueryClientProvider; no app-level "ready" signal exists. `public/sw.js` exists (offline shell).
- Dark app background `oklch(0.145 0 0)`; accent `--color-live #a3e635`.

## Mismatch to resolve
Android's splash is amber (from `background_color`) while the app itself is dark. Whatever the in-app splash ends on must transition from amber to the dark app, or `background_color` changes to dark. Design options must pick one.

## Approaches
1. **Static launch images + in-app animated overlay** (recommended). Generate `apple-touch-startup-image` PNGs (build script from one SVG) matching the overlay's first frame; a client `SplashOverlay` mounted in the root layout plays the reveal and unmounts. Shown on cold start of the standalone app only, once per launch (sessionStorage), skipped under `prefers-reduced-motion` (instant fade).
   - Pro: seamless on iOS and Android; animation fully controllable.
   - Con: ~10 launch PNGs to maintain; overlay must not delay content (cap duration, never block on network).
2. **Static launch images only.** Branded but no animation.
   - Pro: zero runtime cost. Con: does not meet the "animations" ask.
3. **In-app overlay only.** Animation without launch images.
   - Con: iOS shows a blank frame first, then the overlay pops in; the handoff is visible.

## Open product decisions (design artifact)
- Visual + motion variant.
- Background handoff: amber → dark, or dark throughout.
- Duration: minimum display and hard cap.
