# Pre-Proposal Decision Record — gym-tracker-mvp

**Date**: 2026-09-19
**Status**: confirmed
**Research**: R1–R5 complete (`research.md`)
**Authority**: every decision below was answered by the user in interactive preflight. None is inferred.

| ID | Decision | Confirmed value | Basis |
|---|---|---|---|
| P1 | Offline logging | **Offline-first logging.** Sets written locally, synced when signal returns. | User choice; gym signal risk (RK6) |
| P2 | Rest timer scope | **Must alert when pocketed.** Server-sent Web Push at event time, plus screen-on Wake Lock timer. | User choice; R2 |
| P3 | Plate measurement | **Pure ordinal.** No calibration, no estimated mass. | User choice; RK1 |
| P4 | Statistics | **Mass-based aggregates exclude plate-mode exercises.** Plate exercises trend on their own per-exercise charts. | Follows P3 |
| P5 | Deployables | **Keep both** — Next.js frontend + NestJS backend. | User choice (original stated preference) |
| P6 | Auth | **Email + password. No OAuth. No password reset. No email change.** HttpOnly cookie session, long expiry. | User choice + orchestrator evidence (below) |
| P7 | History on recalibration | **Freeze by default, with an explicit user-triggered "recompute history" action** that previews changes before committing. | User choice |
| P8 | Hosting | **New self-managed VPS**, designed for co-tenancy with the user's future personal apps. Portfolio stays on Vercel and is out of scope. | User choice |
| P9 | Database | **Postgres self-hosted on the same VPS.** | User direction |
| P10 | Domain | Both deployables under **one registrable domain** (e.g. `gym.<domain>` + `api.gym.<domain>`). | Hard constraint, see below |
| P11 | DB backups | **Deferred by the user**, to be handled later. Recorded as an accepted risk, not an oversight. | User decision after the risk was stated |

## Session decision — why a session exists at all

The user asked whether sessions were necessary. They are, and the reason is device-specific rather than general:

- R1 established that Safari applies a **7-day script-writable storage cap** and **may evict** script-writable data after disuse. A token held in `localStorage` or IndexedDB is script-writable and can therefore be evicted, logging the user out after a period of not training.
- A cookie set server-side via `Set-Cookie` is not script-writable and is not subject to that cap.
- P2 (pocketed push) independently requires server-held state mapping a push subscription to a user, so server-side session state exists regardless.

For a single-user system this stays minimal: one `session_id → user_id → expires_at` record with a long expiry. No refresh rotation, no device management, no revocation UI.

## Hard constraint — same-site cookies

Because P5 keeps two deployables and P6 uses a cookie session, the frontend and API **must** share one registrable domain (P10). Split across unrelated hosts (e.g. `*.vercel.app` + `*.railway.app`) Safari's tracking prevention treats the API cookie as third-party and authentication breaks on the user's primary device. P8 (own VPS + own domain) satisfies this by construction.

## Accepted risks

| ID | Risk | Status |
|---|---|---|
| AR1 | No password reset flow: forgetting the password locks the user out of all history, with recovery only via a manually-run script. | **Accepted by user.** |
| AR2 | Database backups not implemented at MVP; training history exists in exactly one place. | **Deferred by user.** |
| AR3 | Web Push subscriptions on iOS are reported to go inactive after 1–2 weeks idle (R2). Pocketed-timer reliability must be device-tested, not assumed. | Open — to validate |
| AR4 | Self-managed VPS means user-owned patching, TLS renewal, and uptime. | Accepted as the cost of P8 |
