# Research — web-usable-app

```yaml
schema: gentle-ai.sdd-research/v1
revision: 1
outcome: done
accessed_at: 2026-10-04
```

## Questions

- **R1**: Can a custom keypad stop iOS Safari from opening the system keyboard, and how does it stay usable with VoiceOver?
- **R2**: What does TanStack Query do offline and on failure by default? This is behind W1/W2 from the `web-api-client` verify.
- **R3**: What happens to queued offline sets if a workout is finished before they sync?
- **R4**: Which bottom-sheet primitive fits the stack (shadcn on Base UI)?

## Admission

Sources are web and documentation (context7, web search), plus reads of this repository. No credentials or remote systems were used.

## Sources

| id | class | title | publisher | URL | excerpt |
|---|---|---|---|---|---|
| S1 | community | The inputmode attribute | CSS-Tricks | https://css-tricks.com/?p=287475 | `inputmode="none"` disables the virtual keyboard |
| S2 | issue-tracker | WebKit bug 193811 | WebKit | https://bugs.webkit.org/show_bug.cgi?id=193811 | `inputmode` support history in Safari |
| S3 | community | iOS inputmode | catskull.net | https://catskull.net/ios-inputmode.html | before iOS 13, `none` had no effect |
| S4 | vendor-forum | input type=number not mapped to spinbutton | Apple Developer Forums | https://developer.apple.com/forums/thread/825940 | WebKit announces `type=number` as a text field; no swipe up/down on iOS |
| S5 | community | Incrementing a role=spinbutton with VoiceOver | DEV | https://dev.to/richardjpleguen/incrementing-a-role-spinbutton-with-voiceover-3b1o | custom spinbutton handling under VoiceOver |
| S6 | official-docs | Network Mode | TanStack | https://github.com/tanstack/query/blob/main/docs/framework/react/guides/network-mode.md | default `online`: no fetch without network; `fetchStatus: 'paused'` while `status` stays `pending` |
| S7 | official-docs | Important Defaults | TanStack | https://github.com/tanstack/query/blob/main/docs/framework/react/guides/important-defaults.md | failed queries retried 3 times with exponential backoff before the error shows |
| S8 | official-docs | Query Retries | TanStack | https://github.com/tanstack/query/blob/main/docs/framework/react/guides/query-retries.md | `retryDelay` default doubles from 1000 ms, capped at 30 s |
| S9 | official-docs | Drawer / Sheet (aria registry) | shadcn/ui | https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/aria/drawer.mdx | Drawer uses `swipeDirection="down"`; Sheet `side="bottom"`; a Title is required, `sr-only` allowed |
| S10 | repository | `log-sets.use-case.ts:85` | this repo | `apps/api/src/modules/measurement/application/use-cases/log-sets.use-case.ts` | `if (session.isFinished) throw new WorkoutAlreadyFinishedError(...)` |
| S11 | repository | `apps/web/package.json` | this repo | `apps/web/package.json` | `@base-ui/react ^1.8.0`; only button, card, field, input, label and separator are vendored |

## Validated claims

**R1 — Keypad**
- C1: `inputmode="none"` suppresses the virtual keyboard in iOS Safari from iOS 13. The target is iOS 26, so it is supported. [S1, S2, S3]
- C2: WebKit does not expose numeric inputs as spinbuttons to VoiceOver. A native numeric input gives no accessibility advantage here. [S4]
- C3: A custom control can expose itself as `role="spinbutton"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`, and announce changes through a live region. [S5]
- Design consequence: the value tiles do not need to be inputs at all. A tile can be a `<button>` showing its value, labelled with its name and value; the keypad keys are ordinary buttons; a polite live region announces the edited value. That way no system keyboard can open, and no `inputmode` workaround is needed.

**R2 — Offline and failure (W1/W2)**
- C4: In the default `networkMode: 'online'`, a query that mounts offline stays `status: 'pending'` with `fetchStatus: 'paused'`, so a screen that only checks `isPending` shows a loader forever. This confirms W2. [S6]
- C5: Failed queries retry 3 times with backoff starting at 1 s and doubling (1 + 2 + 4 s), so the error appears about 7 s late. This confirms W1. [S7, S8]
- Fix options: render a paused state from `fetchStatus === 'paused'` ("You're offline"); lower `retry` for reads the user is watching. Both are local to the screens this change rebuilds.

**R3 — Finishing with queued sets** (the critical finding)
- C6: The API refuses any set for a finished session (409 `WORKOUT_ALREADY_FINISHED`). That includes sets logged *before* the finish but synced after it. [S10]
- C7: The web sync use case treats a failed delivery as "still pending" and keeps the set queued. A set logged offline and then followed by Finish would retry forever and never be stored. No data is deleted, but it is stuck. [repository read of `sync-pending-sets.use-case.ts`]
- This is a product decision with two clean options (P1 below). Neither needs a migration.

**R4 — Sheets**
- C8: The shadcn registry offers a Drawer (`swipeDirection="down"`) and a Sheet (`side="bottom"`). Both require a title; a visually hidden title is allowed. Neither is vendored yet. [S9, S11]

## Contradictions and uncertainty

- **U1**: S9 is shadcn's aria-registry doc. Which Drawer the project's `nova` / Base UI preset installs needs confirming with `shadcn add drawer` during apply. **UNVERIFIED.**
- **U2**: VoiceOver with a button-based custom keypad was not tested on a device. It is checked in the device-verification pass.

## Freshness

All sources were accessed on 2026-10-04. Repository facts come from `main` at `13c77ed`.

## Product choices (non-authoritative, owner decides)

- **P1 — Finish with sets still queued**:
  - (a) *Drain first*: Finish syncs the queue and only then finishes. Offline, Finish is refused with "N sets still waiting to sync".
  - (b) *Server accepts late sets*: the API accepts sets for a finished session when `logged_at ≤ finished_at`, so the order stops mattering. This is an API change plus tests.
- **P2 — Workout screen offline**: when "last time" or other reads are unavailable, hide the card or show "offline". Logging always works because of the queue.
