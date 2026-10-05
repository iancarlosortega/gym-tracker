## Exploration: days and weeks follow the phone's time zone

### Current State
Instants are stored in UTC, which is correct (`logged_at` and `started_at` are `timestamptz`). Every place that turns an instant into a day or a week does it in UTC:
- **Web** `features/statistics/presentation/week-start.ts`: `startOfWeek` returns Monday 00:00 **UTC**. Home and the Progress tab send that instant as `weekStart`.
- **API** `read-week.use-case.ts:71`: `trainedOn` is `startedAt.toISOString().slice(0, 10)`, a UTC date.
- **Domain** `statistics/services/progression.service.ts:72`: progression weeks are UTC Mondays.
- **Web** `home/presentation/components/home-views.tsx:14-23`: `lastDoneLabel` compares UTC day numbers and names a UTC weekday. `WeekStrip` builds its days from a UTC date string.

Observed by the owner from Ecuador (UTC−5): at 20:24 on Sunday, local time, a workout reads as Monday, and the week has already rolled over. Every evening after 19:00 local is affected.

`read-volume` takes plain `from` and `to` instants, so it is unaffected.

### Approaches
1. **The phone's IANA zone travels with each statistics read.** It is read with `Intl.DateTimeFormat().resolvedOptions().timeZone` and sent as `timeZone`. The server groups days and weeks in that zone, and the web computes "this Monday" and "last done" in the same zone.
   - Pros: no setting, no migration, and the zone follows the phone when travelling.
   - Cons: two phones in different zones could read different weeks, which is correct for a person.
   - Effort: Low–Medium.
2. **A time zone stored on the profile.** The owner rejected it: "I don't want a new setting".

### Recommendation
Approach 1. A domain helper (`local-calendar`) uses `Intl` with no dependency; it is available in Node and Safari. `timeZone` is optional and defaults to `UTC`, so older cached clients keep working.

### Risks
- DST weeks are 167 or 169 hours long, so the week end must be computed from the next local Monday, not from `+7 days`. Ecuador has no DST, but the helper must be correct anyway.
- An invalid zone string must be refused as a 400, not thrown as a 500.
