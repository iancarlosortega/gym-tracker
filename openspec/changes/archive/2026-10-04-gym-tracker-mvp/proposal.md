# Proposal — gym-tracker-mvp

**Date**: 2026-09-19
**Change**: `gym-tracker-mvp`
**Inputs**: `exploration.md`, `research.md`, `preproposal.md` (all decisions confirmed)

## 1. Why

The user currently records workouts in a notes app. That loses structure, makes week-over-week comparison manual, and cannot enforce the one thing that matters for progression: comparing like with like. The goal is a personal gym tracker — single user, explicitly not a SaaS — that records sets correctly on a phone at the rack and turns them into honest progress over time.

## 2. What this change delivers

A greenfield application in two deployables under one domain:

- **Frontend** — Next.js 16.3.5, installable as a PWA, offline-first logging, screen-on rest timer with Wake Lock.
- **Backend** — NestJS owning the domain model, authentication, sync, statistics, and the Web Push scheduler.
- **Database** — Postgres self-hosted on the same VPS.
- **Infrastructure** — one self-managed VPS with a reverse proxy, designed from the start to host further personal apps alongside this one.

## 3. The central design commitment: measurement modes

Weight is not one quantity. The system models three modes explicitly, and never silently converts between them.

| Mode | User enters | Scale | Resolved load |
|---|---|---|---|
| `TOTAL` | whole load | ratio (mass) | as entered |
| `PER_SIDE` | one side's load | ratio (mass) | `(entry × 2) + bar_weight` |
| `STACK_POSITION` | plate/pin ordinal | **ordinal** | **none — no mass is claimed** |

Rules that follow, and that the spec will make testable:

1. **Ordinals are never converted to mass.** No calibration, no estimates (P3).
2. **Mass-based aggregates exclude `STACK_POSITION` exercises entirely** (P4). A "total volume" figure that sums plate numbers with kilograms is a wrong number that looks right; the system will not produce one.
3. **Plate-mode progress is per-exercise only.** Comparable to itself over time, never across machines.
4. **Every logged set stores the raw entry, its mode, and a snapshot of the parameters used to resolve it** (bar weight, unit, equipment reference). This is what makes P7 possible.
5. **Mass is stored canonically as integer grams** with a display-unit preference, so kg/lb never drift through repeated float conversion.

The user's own arithmetic is preserved exactly: entering `20` in `PER_SIDE` on a 20 kg bar resolves to 60 kg, and both the `20` they think in and the `60` the system computes are retained.

## 4. Scope

### In scope

- Email + password authentication, single account, HttpOnly cookie session (P6).
- Exercise management, including per-exercise default measurement mode.
- Equipment/machine profiles: bar weights, stack descriptions.
- Routine creation with per-exercise target sets, reps, and rest duration.
- Workout session logging: sets, reps, load entry in the exercise's mode.
- Offline-first capture with sync on reconnect (P1).
- Rest timer: on-screen Wake Lock countdown **and** server-scheduled Web Push for the pocketed case (P2).
- Statistics: per-exercise progression over time; mass-based aggregates across ratio-scale exercises only.
- Explicit "recompute history" action with a preview of what would change (P7).
- Deployment onto a co-tenant-ready VPS under one registrable domain (P8, P10).

### Out of scope

- Password reset, email change, OAuth providers (P6 — accepted risk AR1).
- Database backups (P11 — deferred by the user, accepted risk AR2).
- Multi-user support, sharing, social features.
- Native iOS app.
- Plate-to-mass calibration (P3).
- The user's existing Vercel-hosted portfolio.

## 5. Approach

1. **Domain first.** The measurement-mode model is implemented and unit-tested in NestJS before any UI exists. This is where the product's correctness lives.
2. **Vertical slices.** Auth → exercise/equipment CRUD → routine → log a set → offline sync → timer → statistics. Each slice ships working end-to-end rather than completing one layer at a time.
3. **Offline as a first-class path, not a retrofit.** Local write, queue, reconcile. R1 caps iOS storage near 50 MB and allows eviction, so the queue syncs promptly and is never treated as durable storage.
4. **Timer in two parts.** The Wake Lock foreground timer carries no server dependency and is built first; the push path is built against it as the background case.
5. **Infrastructure last but not improvised.** Reverse proxy and per-app isolation are specified deliberately, because app #2 is already anticipated.

## 6. Risks carried into design

| ID | Risk | Severity | Handling |
|---|---|---|---|
| RK1 | Ordinal/mass mixing producing meaningless statistics | CRITICAL | Structurally prevented by §3 rules 1–3; spec scenarios assert it |
| AR3 | iOS push subscriptions reported to expire after 1–2 weeks idle | HIGH | Device-test before relying on it; foreground timer remains the guaranteed path |
| RK5 | Equipment edits rewriting history | MEDIUM | Resolved by §3 rule 4 plus P7's explicit, previewed recompute |
| RK6 | Poor gym signal | MEDIUM | Resolved by P1 offline-first |
| AR2 | No backups; history exists in one place | HIGH | **Deferred by user decision**, documented not designed around |
| AR4 | Self-managed VPS ops burden | MEDIUM | Accepted; proxy and isolation specified rather than ad-hoc |
| RK7 | Two deployables must share one registrable domain or cookie auth breaks on iOS | HIGH | Hard constraint P10, satisfied by P8 |

## 7. Next phase

`sdd-spec` and `sdd-design` (both read this proposal; they are parallel-ready). Design must settle: offline queue and conflict strategy, push scheduling mechanism, VPS topology and co-tenancy shape, and the recompute-history preview mechanism.
