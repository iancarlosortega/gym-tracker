```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:519f2582466ed32850125d176d1ebf813fee18fe74c434aa625f192487c878a8
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 19/19
scenarios: 46/46
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:f3908d4a4e1e1204652b4b262fb1f36c1dde666bd18b54e2e586fa48e117ed14
build_command: cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm build
build_exit_code: 0
build_output_hash: sha256:0beb75089228777121554957c001ec056c4050790e24dfaed688bf0a33e45784
```

# Verify report — web-usable-app

**Verdict: PASS with warnings.** All tasks are complete, including the four device checks (DV-U1 to DV-U4). Every requirement has executed test evidence, plus Ian's iPhone pass. There are no CRITICAL issues.

Runs (2026-10-04, after units 1a–7): domain 215 ✓, api 255 ✓, web 384 ✓; tsc clean; biome clean; `next build` ✓.

## Requirement → evidence

| Spec | Requirement | Evidence |
|------|-------------|----------|
| app-shell | Every main area is one tap away | `tab-bar.test` (active tab per path, labels); DV-U1 (opens on Home) |
| app-shell | Home suggests the next routine | `up-next.service.test` (5 scenarios); `home-views.test` (headline, week strip); `read-week.use-case.test` (`trainedOn`) |
| app-shell | Starting a workout is always explicit | `home-views.test` (a row opens, never starts); `start-sheets.test` (Start / See the plan) |
| app-shell | The central action starts quickly | `tab-bar.test` (+ opens the menu); `start-sheets.test` (up next, picker, empty) |
| app-shell | An open workout stays in reach | `workout-mini-bar.test`; `home-views.test` (rows disabled while a workout is open); `open-workout.test` |
| routines | The next routine is the one done longest ago | domain `up-next.service.test`; api listing tests (ties in list order) |
| routines | Each routine shows when it was last done | PGlite `drizzle-routine-history.repository.test`; `home-views.test` labels |
| routines | A routine reads as a plan, edited with large controls | `routine-views.test`, `entry-editor.test` (4 × 6–8, 3:00), `routine-editor.test` (remove, reorder, add once) |
| routines | Rest follows the routine | `rest-seconds-for.test` (planned / outside / empty = 180) |
| workout-logging | A workout can be finished, even offline | `finish-workout-offline`, `sync-pending-work.use-case.test` (sets before finish); DV-U2 |
| workout-logging | Late sets belong to their workout | api `log-sets.use-case.test` (before / at / after the finish) |
| workout-logging | Last time is shown set by set | PGlite `drizzle-last-sets.repository.test`; `last-time-card.test`; `workout-plan.test` (`lastTimeState`); DV-U4 |
| workout-logging | Values are entered without the system keyboard | `set-keypad.test` (no input, the 22.5 announcement, same as last); `workout-screen.container.test`; DV-U3 (keypad) |
| workout-logging | Reads explain an offline state | `query-state.test` (paused → offline); `query-client.test` (one retry, 1 s) |
| catalog | Exercises are created with how they are loaded | `exercise-forms.test`, `exercise-list.test` (modes, archived hidden, first exercise) |
| catalog | Equipment shows its bar weight and usage | `equipment-views.test`; PGlite usage repository; `get-equipment-usage.use-case.test` |
| catalog | Correcting a bar weight leads to the preview | `bar-weight-form.test`; the container saves the bar weight then navigates to recompute (no set changes until apply) |
| catalog | Catalog lives with routines | `catalog-segments.test`; `tab-bar.test` (Routines tab active on /exercises and /equipment) |
| auth | The user can sign out | `sign-out.use-case.test`, `auth.api.test`, `profile-details.test` |

## Warnings
- VoiceOver was not exercised on the device (owner's choice). Keypad semantics are covered in jsdom only.
- iOS 26 installed-app bottom gap (WebKit 301108): the tab bar floats until the first scroll or after the keyboard closes. The owner accepted this on 2026-10-04.
- Home's open-workout headline ("Push day, 3 of 5 done") is deferred as a follow-up. It is a design detail, not a spec requirement.
- Routine order for ties is the list order (by name); a user-defined routine order is a follow-up.
- 2b's attempt ledger entry carries a probe evidence revision (see apply-progress); the real evidence is recorded there.

## Next
Archive: copy the five delta specs into `openspec/specs/` (no canonical specs exist yet), then move the change into the archive.
