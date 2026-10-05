# Archive report — gym-tracker-mvp

Archived 2026-10-04. No formal verify report: the MVP shipped slice by slice (owner review per slice) and was exercised end to end by the later changes web-api-client, web-usable-app and per-side-loading, including Ian's iPhone device checks.

## Specs synced to `openspec/specs/`
- `auth`, `catalog`, `routines`, `workout-logging`: composed with `gentle-ai sdd-archive-compose` (exit 0); every MVP requirement name was new.
- `measurement`, `rest-timer`, `statistics`: new; copied. In `measurement`, "PER_SIDE resolves using the equipment's bar weight" was reconciled with per-side-loading: the total is `(entry × 2) + (base ?? 0)`, and the old "rejected without a bar" scenario is replaced by "counts no base".

## Final state
- Device checks DV.4 (offline capture) is covered by web-usable-app DV-U2; DV.2's install half by DV-U1.
- Waived by Ian (2026-10-04): DV.1/11b.4 push rest alert with the phone locked, DV.3 wake lock for a full rest, DV.5/14.6 smoke test against the deployed subdomains.
- `state.yaml`'s blocker "repository is not under git" was stale and is cleared.

## Backlog carried forward
- PNG icon set and `apple-touch-icon` (DV.2 icon half).
- B3: drop the `typescript@^6` pin in `apps/api` once TypeScript 7.1 ships its programmatic compiler API.
- On-device push rest-alert test once VAPID keys are set on the deployed API.
