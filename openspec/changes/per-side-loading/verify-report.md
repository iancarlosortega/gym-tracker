# Verify report — per-side-loading

**Verdict: PASS with warnings.** All 9 tasks are complete, and every spec scenario has executed test evidence. The warnings are about coverage depth, not failures.

Runs (2026-10-04): domain 215 ✓, api 255 ✓, web 369 ✓; tsc clean (domain, api, web); biome clean; `next build` ✓.

## Scenario → evidence

| Spec | Scenario | Evidence |
|------|----------|----------|
| catalog | Olympic bar counts its bar (60 kg) | domain load-entry "20 per side on a 20 kg bar is 60 kg"; api log-sets "resolves a per-side set against the bar" |
| catalog | Smith does not count its bar (40 kg) | api log-sets "counts no bar … like a Smith"; domain load-entry Smith; the logged-set null/null case |
| catalog | Plate-loaded without a base weight | api equipment use case "creates plate-loaded … Smith"; DB table test; mapper round trip; web form "leaves the bar out" |
| catalog | Dumbbells per hand (60 lb → 120 lb) | api log-sets dumbbells; domain load-entry; web screen "logs dumbbells per hand in pounds" |
| catalog | Clearing the Smith bar (55 → 40) | domain recompute "bar stops being counted"; api correct-bar null + DTO; web `BarWeightForm` empty → null |
| workout-logging | Dumbbell bench offers dumbbells, "Weight per hand" | web `compatibleEquipment` PER_SIDE; the screen test finds "Weight per hand" |
| workout-logging | Last time per hand "60 lb/hand × 8" | web last-time-card test |
| display-unit | Switching to pounds is remembered | api `ChangeDisplayUnitUseCase` + DTO; web client + Profile toggle |
| display-unit | Logging in pounds | web screen test (entry `fromPounds(60)`, snapshot LB); done-sets lb labels |
| display-unit | kg history shown in lb (60 kg → 132.3 lb) | web units + done-sets tests |

## Warnings
- `PATCH /auth/me` and `PUT /equipment/:id/bar-weight` with null have DTO and use-case tests but no HTTP-level test (consistent with the other endpoints).
- The redirect from saving a bar weight to the recompute preview is container wiring with no test.
- Progress charts and the recompute screen still read kg (out of scope by decision).
- Pre-existing, unchanged: recompute rewrites only `resolved_grams`, and sync re-reads the base at sync time.
- Not yet checked on the device: logging in lb on the iPhone, dumbbells, Smith, clearing a bar.

## Next
Archive once Ian's device pass confirms it (merge the delta specs into `openspec/specs/`).
