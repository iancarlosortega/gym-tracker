# Archive report — web-api-client

Archived 2026-10-04. Verify verdict: **pass_with_warnings** (W1 late unreachable error, W2 offline reads pause). Both were addressed later by web-usable-app (`retry` max 1, paused/offline states in `QueryState`).

## Specs synced to `openspec/specs/`
- `web-api-access`: new; copied mechanically (`diff` empty).

## Final state
- 25/25 tasks checked.
- 1.6 ticked at archive: `apps/web/Dockerfile:22-23` and `compose.yaml:101` carry `NEXT_PUBLIC_API_URL`; Ian edited `.env.example` in `12c21ed`.
- 5.3 closed at archive: sign-in and an offline set synced after reconnect were covered on the device by web-usable-app (DV-U2); the statistics and recompute device check was waived by Ian (2026-10-04).
