# Tasks — gym-tracker-mvp

**Date**: 2026-09-19 · **Re-sliced**: 2026-09-19 after the strict Clean Architecture decision
**Inputs**: `proposal.md`, `specs/*/spec.md`, `design.md`
**Delivery strategy**: `ask-on-risk` → resolved to **chained PRs, one per slice**
**Chain strategy**: **stacked to main**
**Review budget**: 400 changed lines per PR
**MUST**: nothing is committed or pushed until Ian has reviewed it locally.
**Architecture**: strict Clean Architecture in every feature — `domain` (in `packages/domain`) / `application` / `infrastructure` / `presentation`. Tooling: Biome.
**Naming**: files and directories `kebab-case`; classes and types `PascalCase`; variables and functions `camelCase`; database tables and columns `snake_case`. Enforced by Biome, see design §1.5.

---

## Slice 0 — Repository prerequisite (~20 lines) ✅

- [x] 0.1 `git init` the project and make the initial commit (the openspec artifacts are the first commit)
- [x] 0.2 Create the remote repository and push the default branch
- [x] 0.3 Add `.gitignore` covering `node_modules`, build output, and environment files

**Completed by the user on 2026-09-19.** Repo on `main`, remote `git@github.com:iancarlosortega/gym-tracker.git`, initial commit `600b020`. `.gitignore` added and generated `.atl/` untracked — **staged, awaiting local review.**

## Slice 1 — Workspace foundation (~220 lines) ✅ awaiting review

- [x] 1.1 pnpm workspace: `apps/web`, `apps/api`, `packages/domain`, `packages/contracts`
- [x] 1.2 Shared TypeScript config; **Biome** for formatting and linting at the root
- [x] 1.3 Vitest configured in `apps/api`, `apps/web`, and `packages/domain`
- [x] 1.4 Root scripts: `test`, `lint` (`biome check`), `format`, `typecheck`, `build` across all packages
- [x] 1.5 Lint rule forbidding framework imports inside `packages/domain` (enforces the dependency rule mechanically)
- [x] 1.6 Biome `style/useFilenamingConvention` set to `filenameCases: ["kebab-case"]` (off by default, must be enabled) and `style/useNamingConvention` for identifiers
- [x] 1.7 Record the resolved workspace test command into `openspec/config.yaml` and re-evaluate `strict_tdd`

## Slice 2 — Measurement domain (~380 lines) ⚠️ correctness-critical ✅ awaiting review

- [x] 2.1 Value objects: `Grams`, `LoadEntry` (discriminated union), `StackPosition`, `Reps` — in `grams.ts`, `load-entry.ts`, `stack-position.ts`, `reps.ts`
- [x] 2.2 Entity: `LoggedSet` with its resolution snapshot
- [x] 2.3 Service: `resolveMass()` returning `NotApplicable` for `STACK_POSITION` — never `null`, never `0`
- [x] 2.4 Port: `SetRepository` interface (no implementation in this slice)
- [x] 2.5 Tests first: `PER_SIDE` 20 kg on a 20 kg bar → 60 kg; 15 kg on a 10 kg bar → 40 kg
- [x] 2.6 Tests first: `PER_SIDE` without a bar weight is rejected
- [x] 2.7 Tests first: `STACK_POSITION` exposes no mass; cross-exercise ordinal comparison is refused
- [x] 2.8 Tests first: repeated kg↔lb conversion does not drift; unknown mode rejected

**Write 2.5–2.8 before the code they cover.** Every correctness risk in the product lives in this slice.

## Slice 3 — Persistence foundation (~300 lines) ✅ awaiting review

- [x] 3.1 Drizzle schema for all tables
- [x] 3.2 `logged_set` `CHECK`: `resolved_grams` non-null **XOR** `stack_position` non-null
- [x] 3.3 Tombstone and `client_revision` columns
- [x] 3.4 Initial migration
- [x] 3.5 `DrizzleSetRepository` implementing the `SetRepository` port, plus `SetMapper` — the only layer where `snake_case` columns meet `camelCase` properties
- [x] 3.6 Integration test: the database rejects a `STACK_POSITION` row carrying `resolved_grams`

## Slice 4a — Auth domain and application (~220 lines) ✅ awaiting review

- [x] 4a.1 Domain: `User`, `Email`, `PasswordHash`, `SessionId` value objects
- [x] 4a.2 Ports: `UserRepository`, `SessionRepository`, `PasswordHasher`, `Clock`
- [x] 4a.3 Use cases: `SignInUseCase`, `SignOutUseCase`, `SeedAccountUseCase`
- [x] 4a.4 Tests with in-memory port fakes — no database, no framework

## Slice 4b — Auth infrastructure and presentation (~280 lines) ✅ awaiting review

- [x] 4b.1 `Argon2Hasher` adapter
- [x] 4b.2 `DrizzleUserRepository`, `DrizzleSessionRepository`
- [x] 4b.3 Controller, module wiring, auth guard refusing all workout data without a session
- [x] 4b.4 Cookie: `HttpOnly; Secure; SameSite=Lax`, 90-day expiry, sliding renewal
- [x] 4b.5 Generic failure message that does not reveal email existence
- [x] 4b.6 **Startup validation: frontend and API origins must share a registrable domain, else exit** (RK7)
- [x] 4b.7 Tests: expired session refused; 14-day idle session survives

## Slice 5a — Catalog: exercises (~280 lines) ✅ awaiting review

- [x] 5a.1 Domain: `Exercise` entity, mandatory default `MeasurementMode`, `ExerciseRepository` port
- [x] 5a.2 Use cases: create, rename, archive
- [x] 5a.3 Infrastructure: `DrizzleExerciseRepository`, mapper
- [x] 5a.4 Presentation: controller and module
- [x] 5a.5 Tests: archive preserves history and removes the exercise from routine building

## Slice 5b — Catalog: equipment (~280 lines) ✅ awaiting review

- [x] 5b.1 Domain: `Equipment` entity, `BarWeight` and `StackSize` value objects, repository port
- [x] 5b.2 Invariants: bar weight required for `PER_SIDE`; stack size required for `STACK_POSITION`
- [x] 5b.3 Use cases: create, update, archive — edits apply forward only
- [x] 5b.4 Infrastructure and presentation
- [x] 5b.5 Tests: entries above the declared stack size are rejected; existing snapshots untouched by edits

## Slice 6 — Routines (~380 lines) ✅ awaiting review

- [x] 6.1 Domain: `Routine`, `RoutineExercise`, `RestDuration`, `TargetReps`, repository port
- [x] 6.2 Use cases: create, reorder, update targets, archive
- [x] 6.3 Infrastructure and presentation
- [x] 6.4 Tests: order preserved; routine edits do not alter completed sessions

## Slice 7a — Workout sessions (~220 lines) ✅ awaiting review

- [x] 7a.1 Domain: `WorkoutSession` entity, `SessionRepository` port
- [x] 7a.2 Use cases: start from routine, start ad hoc, resume, finish — start from a routine and start ad hoc are one use case with an optional routine
- [x] 7a.3 Infrastructure and presentation
- [x] 7a.4 Tests: an unfinished session is resumable

## Slice 7b — Logging a set, online path (~260 lines) ✅ awaiting review

- [x] 7b.1 `LogSetUseCase` composing `resolveMass` and `SetRepository` — delivered as `LogSetsUseCase`, which takes a batch
- [x] 7b.2 Idempotent upsert keyed on the client-generated UUIDv7 — already in the persistence slice; covered again at the use case
- [x] 7b.3 Presentation endpoint accepting batches
- [x] 7b.4 Test: the same set delivered twice produces exactly one row

## Slice 8a — Offline repository adapter (~220 lines) ✅ awaiting review

- [x] 8a.1 `IndexedDbSetRepository` implementing the **same `SetRepository` port** as Drizzle
- [x] 8a.2 Client-side UUIDv7 generation at log time — in `LogSetOfflineUseCase`, via `Id.createAt`
- [x] 8a.3 Pending-writes-only discipline; history is never stored in the queue
- [x] 8a.4 Tests against the port contract, shared with the Drizzle implementation

## Slice 8b — Sync orchestration (~240 lines) ✅ awaiting review

- [x] 8b.1 `SyncPendingSetsUseCase`: drain the IndexedDB repository through a `SetSyncGateway` — a gateway, not a second repository, because sync needs confirmation rather than storage
- [x] 8b.2 Dequeue only after server confirmation; retain on failure
- [x] 8b.3 Tombstoned deletes; last-write-wins by `(client_revision, logged_at)` — the tuple now applies in both adapters; the client needs no tombstone of its own
- [x] 8b.4 Pending-count indicator; explicit warning when a queue write fails
- [x] 8b.5 Tests: offline log survives restart; queue drains on reconnect; replay does not duplicate

## Slice 9 — Logging UI and PWA shell (~260 lines) ✅ awaiting review

- [x] 9.1 Logging containers and pure presentational components, one-handed and large-target
- [x] 9.2 Web app manifest, `display: standalone`, icons — SVG; a designed PNG/apple-touch set is still outstanding
- [x] 9.3 Service worker: precache the shell, network-first for API reads, never intercept the sync queue
- [x] 9.4 First-run hint teaching Share → Add to Home Screen (iOS offers no install prompt)

## Slice 10 — Foreground rest timer (~240 lines) ✅ awaiting review

- [x] 10.1 Domain: `RestInterval` value object; `StartRestUseCase`, `DismissRestUseCase`
- [x] 10.2 Countdown defaulting to the exercise's rest duration; adjust and skip — **outstanding**: rest is configured on a routine entry, not on an exercise, and the client has no routine read yet, so every rest is the three-minute default. `LogWorkoutContainer` takes a `restSecondsFor` lookup for whoever closes this.
- [x] 10.3 `navigator.wakeLock` acquired during countdown; released on completion, dismissal, or visibility change
- [x] 10.4 Acquisition failure degrades silently; countdown still runs
- [x] 10.5 Audible and visual completion cue

## Slice 11a — Push scheduling (~260 lines) ✅ awaiting review

- [x] 11a.1 Domain: `ScheduledPush` entity, `PushScheduler` and `PushSender` ports
- [x] 11a.2 `SchedulePushUseCase` / `CancelPushUseCase` — dismissal cancels the scheduled row
- [x] 11a.3 Infrastructure: one-second tick claiming due rows with `SELECT ... FOR UPDATE SKIP LOCKED`
- [x] 11a.4 `WebPushSender` adapter with VAPID configuration — the keys are optional, so a deployment without them still runs the foreground timer
- [x] 11a.5 Tests: dismissal cancels; a restart does not drop a pending push

## Slice 11b — Subscriptions and disclosure (~200 lines) ⚠️ carries AR3 ✅ awaiting review, except the device test

- [x] 11b.1 Push subscription registration stored per user
- [x] 11b.2 `410`/`404` from the push service marks the subscription invalid
- [x] 11b.3 Disclosure UI: not installed, permission denied, or subscription invalid
- [ ] 11b.4 **Physical iPhone test: rest alert arrives with the app backgrounded and the phone locked.** → deferred to **Device verification**, below. This slice does not close until it is recorded.

## Device verification — deferred to the end ⚠️ nothing here closes on unit tests

Everything that can only be proven on real hardware, collected here by the
user's decision rather than blocking the slice that produced it. Each item
names the slice it belongs to and what has to be true before it can be run.

- [ ] DV.1 (11b.4) **Rest alert arrives with the app backgrounded and the iPhone locked.** Needs: VAPID keys generated (`npx web-push generate-vapid-keys`), `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` set on an API served over HTTPS, the app added to the home screen, then a real rest started and the phone locked. Record the result here.
- [ ] DV.2 (9.2) **Home-screen install shows the app icon and opens standalone.** The SVG icons are placeholders; a designed PNG set and an `apple-touch-icon` are still outstanding.
- [ ] DV.3 (10.3) **The screen stays awake for a full rest on the device**, and dims again once the countdown ends.
- [ ] DV.4 (8a/8b) **Offline capture on the real device**: log sets in airplane mode, close the app, reopen it still offline, then restore connectivity and confirm the queue drains exactly once.

## Slice 12 — Statistics (~380 lines) ✅ awaiting review, except the web page

- [x] 12.1 Domain: `progression()` and aggregate services; `StatisticsRepository` port
- [x] 12.2 Mass aggregates exclude every `STACK_POSITION` set
- [x] 12.3 All-ordinal period returns "not applicable" rather than zero
- [x] 12.4 Excluded-set count disclosed alongside every mass aggregate — carried in the type, so the figure cannot be read without it
- [x] 12.5 Week-over-week within one exercise and one mode; mode changes reported, not drawn as a continuous trend
- [x] 12.6 Presentation: per-exercise progression views, ordinal series labelled as plate positions — **API views done**; the web statistics page is page-level work and goes through design options first
- [x] 12.7 Tests for 12.2–12.5

## Slice 13 — Recompute history (~320 lines)

- [ ] 13.1 `PreviewRecomputeUseCase`: in-memory recomputation, per-set before/after, affected count, personal-record impact, zero writes
- [ ] 13.2 `preview_token` binding a confirmation to the exact diff displayed
- [ ] 13.3 `ApplyRecomputeUseCase`: re-derive, compare against the token, apply in one transaction, write `recompute_audit`
- [ ] 13.4 `STACK_POSITION` sets excluded from scope
- [ ] 13.5 Presentation: preview and confirm UI
- [ ] 13.6 Tests: declining changes nothing; a stale token is refused

## Slice 14 — VPS deployment (~260 lines)

- [ ] 14.1 Dockerfiles for both apps
- [ ] 14.2 Compose stack with declared memory limits
- [ ] 14.3 Caddy reverse proxy: `gym.<domain>` and `api.gym.<domain>`, automatic TLS
- [ ] 14.4 Shared Postgres with a dedicated database and role for this app
- [ ] 14.5 Production configuration and the one-time account seed
- [ ] 14.6 End-to-end smoke test against the deployed subdomains from the iPhone

---

## Backlog — agreed, not yet scheduled

- [ ] B1 Introduce a generic `DomainError` base class carrying an `errorCode` and a message, and re-parent every domain error onto it. Requested 2026-09-19. Rationale: error codes survive translation and message edits, so the presentation layer can map a code to user-facing copy and to an HTTP status without string-matching prose. Slice 2's errors are plain `Error` subclasses today; converting them is mechanical and belongs with the first slice that needs to surface errors over the wire (slice 4b or 7b).

## Naming — type suffixes

Files carry a suffix naming what they are: `*.entity.ts`, `*.vo.ts`, `*.service.ts`, `*.port.ts`, `*.use-case.ts`, `*.repository.ts`, `*.mapper.ts`, `*.controller.ts`, `*.module.ts`. Applied to slice 2 on 2026-09-19.

## Review Workload Forecast

| Metric | Before (depth-where-earned) | **After (strict Clean Architecture)** |
|---|---|---|
| Estimated total changed lines | ~4040 | **~5160** |
| Slices / PRs | 14 | **20** |
| Largest single slice | 380 | **380** |
| Slices over the 400-line budget | 0 | **0** |
| 400-line budget risk | High | **High** |
| Chained PRs recommended | Yes | **Yes — confirmed by the user** |

The uniform four-layer shape adds roughly **1100 lines and 6 additional PRs**. That is the accepted cost of never having to decide where a piece of code belongs. Slices 4, 5, 7, 8, and 11 were split so that every slice stays inside the review budget.

**Confirmed dependency chain**: 0 → 1 → 2 → 3 → 4a → 4b → 5a → 5b → 6 → 7a → 7b → 8a → 8b → 9 → 10 → 11a → 11b → 12 → 13 → 14.
Slices 12 and 13 depend only on 3 and 7b, so they may run in parallel with 9–11b.
