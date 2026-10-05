# Verify report — optimistic-ui-and-polish

**Verdict**: PASS. 9 requirements and 25 scenarios. Verified 2026-10-04.

| Spec | Requirement | Evidence |
|---|---|---|
| responsive-ui | Edits to existing things show at once | Tests: `lib/optimistic.test.ts`, `auth/presentation/queries.test.tsx`, `routines/presentation/queries.test.tsx`, `catalog/presentation/queries.test.tsx`. Device: DV.1. |
| responsive-ui | Rapid taps keep their order | Tests: scope serialisation in `optimistic.test.ts`, the lb→kg sequence test and the three-moves test. |
| responsive-ui | A failed change is undone where it was made | Tests: the rollback cases in `optimistic.test.ts` and `RollbackNotice` tests. |
| responsive-ui | Changes that need the server's answer say they are working | Tests: `workout-page.container.test.tsx` (starting, failed with Try again). Device: DV.4. Create forms are already disabled while pending. |
| responsive-ui | Navigation does not hang on a weak connection | Tests: `sw.test.ts` (cross-origin skipped, timeout fallback, preload, v3 dropped). Device: DV.3. |
| routines | The user puts routines in their own order | Tests: `routine.use-cases.test.ts` ordering, `routine-views.test.tsx` move and handle, `queries.test.tsx` order. Device: DV.2. |
| routines | Existing and new routines get a place in the order | Tests: migration test (alphabetical backfill per user, NOT NULL) and "new one last". |
| app-shell | Home shows the open workout's progress | Tests: `session-progress.test.ts` and `home-views.test.tsx`. Device: DV.4. |
| display-unit | Progress and recompute read in the chosen unit | Tests: `progression-unit.test.ts`, chart label, recompute tests in lb. Device: DV.5. |

## Checks
- `pnpm test` passed: 220 domain, 263 API and 428 web tests at apply.
- These grew to 228, 269 and 430 after local-time-weeks.
- Typecheck, biome and both builds are clean.

## Warnings
- **W1**: routine archive applies its patch at once but still waits for the server before navigating.
- **Found during device checks**: screens outside the tab bar were narrower than full width. Fixed in `0c5ebec`.
