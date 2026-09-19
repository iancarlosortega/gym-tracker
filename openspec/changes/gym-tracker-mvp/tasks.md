# Tasks — gym-tracker-mvp

**Date**: 2026-09-19
**Inputs**: `proposal.md`, `specs/*/spec.md`, `design.md`
**Delivery strategy**: `ask-on-risk` → resolved to **chained PRs, one per slice**
**Chain strategy**: **stacked to main**
**Review budget**: 400 changed lines per PR

Slices are ordered by dependency and each one is independently reviewable. Estimates are changed lines including tests.

---

## Slice 0 — Repository prerequisite (~20 lines)

- [ ] 0.1 `git init` the project and make the initial commit (the openspec artifacts are the first commit)
- [ ] 0.2 Create the remote repository and push the default branch
- [ ] 0.3 Add `.gitignore` covering `node_modules`, build output, and environment files

Chained PRs cannot exist without this. It is listed as a slice so it is not skipped silently.

---

## Slice 1 — Workspace foundation (~180 lines)

- [ ] 1.1 Initialise pnpm workspace with `apps/web`, `apps/api`, `packages/contracts`
- [ ] 1.2 Shared TypeScript config, ESLint, Prettier at the root
- [ ] 1.3 Vitest configured in `apps/api` and `apps/web`
- [ ] 1.4 Root scripts: `test`, `lint`, `typecheck`, `build` covering every workspace package
- [ ] 1.5 Record the resolved workspace test command back into `openspec/config.yaml` and re-evaluate `strict_tdd`

## Slice 2 — Measurement domain core (~320 lines) ⚠️ correctness-critical

- [ ] 2.1 `LoadEntry` discriminated union and `Grams` type in `packages/contracts`
- [ ] 2.2 `resolveMass()` returning `NotApplicable` for `STACK_POSITION` — never `null`, never `0`
- [ ] 2.3 Unit tests: `PER_SIDE` 20 kg on a 20 kg bar resolves to 60 kg; 15 kg on a 10 kg bar resolves to 40 kg
- [ ] 2.4 Unit tests: `PER_SIDE` without a bar weight is rejected
- [ ] 2.5 Unit tests: `STACK_POSITION` exposes no mass and is refused across exercises
- [ ] 2.6 Unit tests: repeated kg↔lb display conversion does not drift
- [ ] 2.7 Reject entries with a missing or unknown mode

**Write the tests in 2.3–2.6 before the implementation they cover.** This slice carries every correctness risk in the product.

## Slice 3 — Schema and migrations (~260 lines)

- [ ] 3.1 Drizzle schema: `user`, `session`, `exercise`, `equipment`, `routine`, `routine_exercise`, `workout_session`, `logged_set`, `scheduled_push`, `push_subscription`, `recompute_audit`
- [ ] 3.2 `logged_set` `CHECK`: `resolved_grams` non-null **XOR** `stack_position` non-null
- [ ] 3.3 Tombstone and `client_revision` columns for sync
- [ ] 3.4 Initial migration
- [ ] 3.5 Integration test: inserting a `STACK_POSITION` row carrying `resolved_grams` is rejected by the database

## Slice 4 — Auth (~300 lines)

- [ ] 4.1 Argon2id hashing; one-time account seeding command (not a public route)
- [ ] 4.2 Sign-in and sign-out; generic failure message that does not reveal email existence
- [ ] 4.3 Session table, opaque cookie id, `HttpOnly; Secure; SameSite=Lax`, 90-day expiry with sliding renewal
- [ ] 4.4 Auth guard refusing all workout data without a valid session
- [ ] 4.5 **Startup validation: frontend origin and API origin must share a registrable domain, else exit with a configuration error** (RK7)
- [ ] 4.6 Tests: expired session refused; session survives 14 days idle; cookie absent from script-readable storage

## Slice 5 — Catalog: exercises and equipment (~340 lines)

- [ ] 5.1 Exercise CRUD with a mandatory default measurement mode
- [ ] 5.2 Archive preserves history and removes the exercise from routine building
- [ ] 5.3 Equipment CRUD: bar weight required for `PER_SIDE`; stack position count required for `STACK_POSITION`
- [ ] 5.4 Reject stack entries above the declared position count
- [ ] 5.5 Equipment edits apply forward only; existing snapshots untouched
- [ ] 5.6 Web UI for both

## Slice 6 — Routines (~280 lines)

- [ ] 6.1 Routine CRUD with ordered exercises
- [ ] 6.2 Per-exercise target sets, reps, and rest duration
- [ ] 6.3 Routine edits do not alter completed sessions
- [ ] 6.4 Web UI

## Slice 7 — Session logging, online path (~360 lines)

- [ ] 7.1 Start a session from a routine or ad hoc; resume an unfinished session
- [ ] 7.2 Log a set: raw entry, mode, reps, resolution snapshot persisted
- [ ] 7.3 Idempotent upsert keyed on the client-generated UUIDv7
- [ ] 7.4 Test: the same set delivered twice produces exactly one row
- [ ] 7.5 One-handed, large-target logging UI

## Slice 8 — Offline capture and sync (~380 lines)

- [ ] 8.1 IndexedDB write-ahead queue holding pending writes only, never history
- [ ] 8.2 Client-side UUIDv7 generation at log time
- [ ] 8.3 Immediate local render; no error surfaced while offline
- [ ] 8.4 Batch transmission on reconnect; dequeue only after server confirmation
- [ ] 8.5 Failed transmission retains the item for retry
- [ ] 8.6 Tombstoned deletes; last-write-wins by `(client_revision, logged_at)`
- [ ] 8.7 Pending-count indicator; explicit warning when a queue write fails
- [ ] 8.8 Tests: offline log survives restart; queue drains on reconnect; replay does not duplicate

## Slice 9 — Service worker and PWA install (~200 lines)

- [ ] 9.1 Web app manifest, `display: standalone`, icons
- [ ] 9.2 Hand-rolled service worker: precache the shell, network-first for API reads, never intercept the sync queue
- [ ] 9.3 First-run hint teaching Share → Add to Home Screen (iOS offers no install prompt)

## Slice 10 — Foreground rest timer (~220 lines)

- [ ] 10.1 Countdown offered on set completion, defaulting to the exercise's rest duration
- [ ] 10.2 Adjust and skip
- [ ] 10.3 `navigator.wakeLock` acquired during countdown; released on completion, dismissal, or visibility change
- [ ] 10.4 Wake-lock acquisition failure degrades silently, countdown still runs
- [ ] 10.5 Audible and visual completion cue

## Slice 11 — Push-backed pocketed alerts (~340 lines) ⚠️ carries AR3

- [ ] 11.1 VAPID key generation and configuration
- [ ] 11.2 Push subscription registration, stored per user
- [ ] 11.3 `scheduled_push` row written when rest starts; deleted when rest is dismissed
- [ ] 11.4 One-second tick claiming due rows with `SELECT ... FOR UPDATE SKIP LOCKED`
- [ ] 11.5 Delivery via `web-push`; `410`/`404` marks the subscription invalid
- [ ] 11.6 Disclosure UI: not installed, permission denied, or subscription invalid states
- [ ] 11.7 Tests: dismissal cancels the scheduled push; a restart does not drop a pending push
- [ ] 11.8 **Physical device test on the iPhone: rest alert arrives with the app backgrounded and the phone locked.** Record the result; do not mark this slice complete on unit tests alone.

## Slice 12 — Statistics (~320 lines)

- [ ] 12.1 Per-exercise progression for all three modes; ordinal series labelled as plate positions
- [ ] 12.2 Mass aggregates excluding every `STACK_POSITION` set
- [ ] 12.3 All-ordinal period returns "not applicable" rather than zero
- [ ] 12.4 Excluded-set count disclosed alongside every mass aggregate
- [ ] 12.5 Week-over-week within one exercise and one mode; report mode changes instead of drawing a continuous trend
- [ ] 12.6 Tests for 12.2–12.5

## Slice 13 — Recompute history (~280 lines)

- [ ] 13.1 Preview endpoint: in-memory recomputation, per-set before/after, affected count, personal-record impact, zero writes
- [ ] 13.2 `preview_token` binding a confirmation to the exact diff displayed
- [ ] 13.3 Apply endpoint: re-derive, compare against the token, apply in one transaction, write `recompute_audit`
- [ ] 13.4 `STACK_POSITION` sets excluded from scope
- [ ] 13.5 Tests: declining changes nothing; a stale token is refused

## Slice 14 — VPS deployment (~260 lines)

- [ ] 14.1 Dockerfiles for both apps
- [ ] 14.2 Compose stack with declared memory limits
- [ ] 14.3 Caddy reverse proxy: `gym.<domain>` and `api.gym.<domain>`, automatic TLS
- [ ] 14.4 Shared Postgres with a dedicated database and role for this app
- [ ] 14.5 Production environment configuration and the one-time account seed
- [ ] 14.6 End-to-end smoke test against the deployed subdomains from the iPhone

---

## Review Workload Forecast

| Metric | Value |
|---|---|
| Estimated total changed lines | **~4040** |
| Slices | 14 |
| Largest single slice | Slice 8, ~380 lines |
| Slices over the 400-line budget | 0 |
| **400-line budget risk** | **High** (total is ~10× a single PR budget) |
| **Chained PRs recommended** | **Yes** |
| **Decision needed before apply** | **Yes** |

Every slice was deliberately sized under 400 lines so that each one can ship as its own reviewable PR. The total cannot ship as a single PR.

**Confirmed dependency chain**: 0 → 1 → 2 → 3 → 4 → {5 → 6 → 7} → 8 → 9 → 10 → 11 → 12 → 13 → 14.
Slices 12 and 13 depend only on 3 and 7, so they can run in parallel with 9–11 if desired.
