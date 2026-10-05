# Verify report — local-time-weeks

**Verdict**: PASS. 2 requirements and 6 scenarios. Verified 2026-10-04.

| Requirement | Evidence |
|---|---|
| Days and weeks follow the phone's time zone | `local-calendar.test.ts` (evening date, local Monday, Madrid DST week end, zone check). `read-week.use-case.test.ts` (Sunday-evening workout on Sunday; excluded from the next local week; mid-week instant). `progression.service.test.ts` (Sunday-evening set in its local week). `time-zone.query.test.ts` (unknown zone refused). |
| Home reads days in local time | `home-views.test.tsx` ("Last done today" for this evening in Ecuador; local weekday). `statistics.api.test.ts` (zone sent). Device: Ian confirmed the workout shows on Sunday. |

## Checks
- `pnpm test` passed: 228 domain, 269 API and 430 web tests.
- Typecheck, `biome check .`, the API build and `next build` are all clean.
