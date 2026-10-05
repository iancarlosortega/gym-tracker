# Design — local-time-weeks

## D1. Domain `shared/services/local-calendar.ts`
This helper is pure and uses only `Intl`.
- `isTimeZone(zone)`: `true` if `new Intl.DateTimeFormat('en-US', { timeZone: zone })` does not throw.
- `localDate(instant, zone)`: returns `YYYY-MM-DD` from `formatToParts` with `en-CA`-style year, month and day parts.
- `offsetMinutes(instant, zone)`: format the parts (year…second, `hourCycle: 'h23'`), take `Date.UTC(parts)` and subtract the instant.
- `startOfLocalDay(date: 'YYYY-MM-DD', zone)`:
  - Guess `g = Date.UTC(y, m-1, d)`, then compute `t = g - offset(g)`.
  - If `offset(t) !== offset(g)`, correct to `t = g - offset(t)`. This handles DST.
- `startOfLocalWeek(instant, zone)`:
  - Take the local date of the instant.
  - Use UTC arithmetic on that date to find the weekday and step back to Monday.
  - Return `startOfLocalDay(monday)`.
- `addLocalDays(date, n)`: date-string arithmetic in UTC.

## D2. Progression
`progression(exerciseId, sets, zone = 'UTC')` groups by `startOfLocalWeek(set.loggedAt, zone)`. `startOfWeek` in `progression.service.ts` becomes `startOfLocalWeek(instant, 'UTC')`; it is kept exported only if it is still used, otherwise removed.

## D3. API
- `TimeZoneQueryDto` gets an optional `timeZone` string with a custom class-validator rule that calls `isTimeZone`. A failure is a 400 through the global `ValidationPipe`. `ReadWeekDto` and `ReadVolumeDto` (the latter is used by progression) both extend it.
- `ReadWeekUseCase` takes `{ weekStart, timeZone = 'UTC' }`.
  - `current` is computed as `startOfLocalWeek(weekStart, zone)`. The client's instant is re-normalised, which tolerates old clients.
  - The current week's end is the start of the local day 7 days after its local Monday, minus 1 ms.
  - The previous week and the week before it are computed the same way, 7 local days back.
  - `trainedOn` is the sorted set of `localDate(startedAt, zone)`.
- `ReadProgressionUseCase` passes the zone to `progression`.

## D4. Web
- `lib/local-time.ts` holds `localTimeZone()`. It reads `Intl…resolvedOptions().timeZone` and falls back to `'UTC'`.
- `statistics/presentation/week-start.ts`: `startOfWeek(instant, zone = localTimeZone())` delegates to the domain `startOfLocalWeek`.
- The api functions add `timeZone` to the params. The query keys include the zone.
- Home:
  - `WeekStrip` receives `weekStart = localDate(weekStart, zone)`, the local Monday date, and `today = localDate(now, zone)`. Days are built with `addLocalDays` and the day labels are unchanged.
  - Check whether the strip currently marks today from UTC and fix it the same way.
- `lastDoneLabel(lastDoneAt, now, zone = 'UTC')`:
  - `daysAgo` is the difference between the two local dates.
  - The weekday and the date are taken from the local date string.
  - Tests pass an explicit zone.

## D5. Slices
- **S1** covers the domain and the API: the helper, progression, the DTO and the week use case, with tests including a DST zone.
- **S2** covers the web: sending the zone, the local week start, the strip and the last-done label, with tests.
