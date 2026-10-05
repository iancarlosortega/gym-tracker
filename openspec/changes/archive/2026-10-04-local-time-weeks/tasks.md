# Tasks — local-time-weeks

Strict TDD. Commit each unit once its tests, typecheck, biome and build are green.

## S1 — Domain + API
- [x] 1.1 `local-calendar` (D1). Tests:
  - Guayaquil evening resolves to the local date.
  - The local week start is an instant at local midnight.
  - The Madrid week across the October clock change ends at the next local Monday.
  - `isTimeZone` accepts and refuses correctly.
- [x] 1.2 Progression weeks in the given zone (D2).
- [x] 1.3 `timeZone` query param with validation, added to the week and progression endpoints. The week bounds and `trainedOn` are computed in the zone (D3). Use-case and DTO tests.

## S2 — Web
- [x] 2.1 `localTimeZone()`. The api and queries send the zone and key on it.
- [x] 2.2 `startOfWeek` in local time. The week strip and today use local dates. `lastDoneLabel` uses local days.

## Device verification
- [x] DV.1 On a Sunday evening in Ecuador, a workout shows on Sunday, Home reads "Last done today", and the week has not rolled over. Confirmed by Ian on the iPhone (2026-10-04): the workout shows on Sunday.

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| S1 | ~280 |
| S2 | ~180 |

- Chained PRs recommended: No.
- 400-line budget risk: Low.
- Decision needed before apply: No.
