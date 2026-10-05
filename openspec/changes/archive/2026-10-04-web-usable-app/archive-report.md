# Archive report — web-usable-app

Archived 2026-10-04. Verify verdict: **pass_with_warnings** (envelope validated by `gentle-ai sdd-verify-validate`, 19/19 requirements, 46/46 scenarios, evidence revision sha256:519f2582…78a8).

## Specs synced to `openspec/specs/` (none existed; copied mechanically, `diff` empty for each)
- app-shell, auth, catalog, routines, workout-logging

## Final state
- Tasks: all complete, including the device checks (DV-U1, U2, U4 passed; U3 keypad passed, VoiceOver not tested by owner's choice).
- Units 1a–7 committed to main. Unit 6 and 7 came from Ian's iPhone passes: safe area, equipment creation, the log blocker, per-exercise values, the routine editor, the service worker that pinned phones to their first build, the root safe area, the fixed tab bar, skeletons, and pull to refresh.
- Accepted limitation: the iOS 26 standalone bottom gap (WebKit 301108). The owner chose to leave it.
- Follow-ups: Home's open-workout headline; a user-defined routine order.
- Known ledger note: 2b's attempt evidence revision is a probe placeholder; the real evidence is in apply-progress.md.
