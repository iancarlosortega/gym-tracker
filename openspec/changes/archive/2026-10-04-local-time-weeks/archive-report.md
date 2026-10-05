# Archive report — local-time-weeks

Archived 2026-10-04. Verify verdict: **pass**.

## Specs synced to `openspec/specs/`
- `statistics` and `app-shell` were composed with `gentle-ai sdd-archive-compose`.

## Final state
- S1: the domain changes are in `5db26c9` and the API changes in `f8f3d66`.
- S2: the web changes are in `f7053de`.
- The planning artifacts are in `5d889e0`.
- DV.1 was confirmed on the device.
- Days and weeks follow the phone's IANA zone, which is sent with each request. No setting was added and nothing was migrated.
