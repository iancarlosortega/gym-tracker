# Proposal: Days and weeks follow the phone's time zone

## Intent
Workouts logged in the evening in Ecuador (UTC−5) show up on the next day, and the week rolls over on Sunday at 19:00. The cause is that days and weeks are cut in UTC. The owner wants the phone's own time zone used for this, with **no new setting**.

## Scope
### In Scope
- A domain helper, `local-calendar`, covering:
  - the local date of an instant;
  - the Monday 00:00 of the local week as an instant, correct across DST;
  - validating an IANA zone.
- Progression weeks are grouped in the given zone.
- `GET /statistics/week` and `GET /statistics/exercises/:id/progression` accept an optional `timeZone` (IANA). It defaults to `UTC`, and an invalid value returns 400.
- `trainedOn` is computed as local dates. The week runs from the given local Monday to the next local Monday.
- The web sends the phone's zone, computes "this week" and the week strip in local time, and reads "Last done …" in local days.

### Out of Scope
- A stored time-zone preference.
- Any change to how instants are stored.
- Recompute and the workout timer, which already work on instants.

## Capabilities
### Modified Capabilities
- `statistics`: weeks and days follow the phone's time zone.
- `app-shell`: Home's week strip and "Last done" follow local days.

## Approach
Use `Intl.DateTimeFormat` with `timeZone`; there is no new dependency. The domain owns the calendar math, the API validates the zone and passes it down, and the web supplies `localTimeZone()` and includes it in the query keys.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `packages/domain/src/shared/services/local-calendar.ts` | New | local date, local week start, zone check |
| `packages/domain/src/statistics/services/progression.service.ts` | Modified | weeks in zone |
| `apps/api/src/modules/statistics` | Modified | `timeZone` query param, week bounds, `trainedOn` |
| `apps/web/src/features/{statistics,home}` | Modified | send zone, local week start, local last-done |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DST week length | Low (Ecuador has none) | Week end is the next local Monday; tests cover a DST zone. |
| Bad zone string crashes | Low | A validator returns 400. |

## Rollback Plan
Revert the commits. Clients without `timeZone` keep the UTC behaviour.

## Success Criteria
- [ ] A workout started at 20:24 on Sunday in America/Guayaquil is marked on Sunday in the week strip, and Home reads "Last done today".
- [ ] The week does not roll over until local Monday 00:00.
- [ ] Progress weeks start on local Mondays.
