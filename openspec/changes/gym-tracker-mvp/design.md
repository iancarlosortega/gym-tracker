# Design — gym-tracker-mvp

**Date**: 2026-09-19
**Inputs**: `proposal.md`, `preproposal.md`, `specs/*/spec.md`, `research.md`
**Purpose**: settle the four open architectural questions and the stack choices they depend on.

---

## 1. Repository and deployable shape

**Decision**: a single pnpm workspace monorepo with two deployables and one shared package.

```
apps/web      Next.js 16.3.5   → gym.<domain>
apps/api      NestJS           → api.gym.<domain>
packages/contracts   shared TypeScript types + zod schemas
```

**Why**: P5 keeps two deployables, and the highest risk of that split is contract drift — the frontend and backend disagreeing about the shape of a logged set. A shared `contracts` package makes that a compile error instead of a runtime surprise. One repo, one version, one CI.

**Rejected**: two separate repositories (contract drift with no compiler to catch it); a Nx/Turbo build graph (unjustified machinery for two apps).

---

## 2. Persistence and the measurement model

**Decision**: Postgres via **Drizzle ORM**.

**Why Drizzle over Prisma**: this runs on a shared 4 GB VPS hosting future apps. Prisma's query engine is an extra resident process per service; Drizzle compiles to plain SQL with no engine sidecar. Drizzle's schema is also ordinary TypeScript, so the `LoadEntry` discriminated union below is expressible directly rather than mirrored in a separate DSL.

**Rejected**: Prisma (engine footprint, DSL duplication of the mode union); TypeORM (decorator-heavy, weaker inference for discriminated unions); raw SQL (no migration story worth the savings).

### 2.1 The `logged_set` shape

The spec requires that the raw entry, the mode, and the resolution snapshot all survive. That drives these columns:

| Column | Notes |
|---|---|
| `id` | **UUIDv7, generated on the client.** This is the idempotency key (§4). |
| `session_id`, `exercise_id`, `equipment_id` | references |
| `mode` | `TOTAL` \| `PER_SIDE` \| `STACK_POSITION` |
| `raw_value` | exactly what the user typed |
| `raw_unit` | `KG` \| `LB` \| `NULL` for ordinal |
| `resolved_grams` | **NULLABLE — always `NULL` for `STACK_POSITION`** |
| `stack_position` | **NULLABLE — non-null only for `STACK_POSITION`** |
| `snapshot_bar_grams` | bar weight at log time, or `NULL` |
| `reps`, `logged_at`, `synced_at` | |

A `CHECK` constraint enforces the exclusivity: `resolved_grams` non-null **xor** `stack_position` non-null. The database itself refuses to hold a plate set that claims a mass. RK1 is prevented at the storage layer, not only in application code — this is deliberate, because application code gets refactored and constraints do not.

### 2.2 Domain representation

```ts
type LoadEntry =
  | { mode: 'TOTAL';          grams: number }
  | { mode: 'PER_SIDE';       perSideGrams: number; barGrams: number }
  | { mode: 'STACK_POSITION'; position: number }

resolveMass(e: LoadEntry): Grams | NotApplicable
```

`resolveMass` returns an explicit `NotApplicable` for the ordinal case rather than `null` or `0`. A nullable number invites `?? 0`, and `?? 0` is precisely how a plate set silently enters an average. The type makes the honest path the easy one.

All arithmetic is integer grams. Display conversion happens at the edge only.

---

## 3. Offline capture and sync

**Decision**: IndexedDB write-ahead queue with client-generated UUIDv7 ids and server-side idempotent upsert.

**Flow**: log → write to IndexedDB and render immediately → enqueue → on connectivity, `POST` batches → server upserts by primary key → on confirmation, mark synced and drop from the queue.

**Conflict strategy**: **there is effectively no conflict to resolve.** Sets are append-only facts authored by one user on one device at a time. The realistic failure is not divergent edits but *duplicate delivery* — a set that arrived while its acknowledgement was lost. Client-generated ids make the server write idempotent: the second delivery is an upsert onto the same row, satisfying the spec's "exactly one set" scenario.

For the rarer edit/delete case, each set carries a `client_revision` counter and last-write-wins by `(client_revision, logged_at)`. Deletes are tombstoned rather than removed, so a delete cannot be resurrected by a replayed create.

**Storage discipline** (R1: ~50 MB cap, evictable): the queue holds pending writes only, never history. History is server-read and cached separately with a bounded, disposable cache. A queue write failure surfaces to the user immediately per spec — it is the one case where silence would cost real data.

**Rejected**: a CRDT or sync engine (enormous machinery for a single-user append-only log); server-generated ids (makes idempotency impossible without a second dedupe key); background sync API (R1: unavailable on iOS).

---

## 4. Rest-timer push scheduling

**Decision**: database-backed scheduled pushes with a 1-second in-process tick, delivered via `web-push` with VAPID keys.

**Flow**: rest starts → client `POST`s `{ set_id, fire_at }` → row in `scheduled_push` → API ticks every second, claims rows where `fire_at <= now()` using `SELECT ... FOR UPDATE SKIP LOCKED`, sends the push, marks it sent. Dismissing rest deletes the pending row, satisfying the cancellation scenario.

**Why not `setTimeout` in the Node process**: a deploy, crash, or restart during a 3-minute rest silently drops the alert. The user is standing in the gym trusting a buzz that will never come. A durable row survives restarts; the tick picks it up late rather than never.

**Why a 1-second tick and not a job queue**: the scheduling horizon is minutes and the volume is one user. BullMQ would add Redis — another resident process on a shared VPS — to schedule roughly twenty rows a day. `SKIP LOCKED` polling is correct, boring, and costs nothing.

**Subscription invalidation** (AR3): a `410 Gone` or `404` from the push service marks the subscription invalid. The next foreground load sees the invalid flag and prompts re-enablement, satisfying the spec's disclosure requirement. **The foreground Wake Lock timer never depends on any of this** — it is the guaranteed path, and push is the enhancement.

**Install detection**: pocketed alerts are only offered when the app is running in standalone display mode with notification permission granted. Otherwise the UI states the home-screen install requirement (R1: push requires installation).

---

## 5. VPS topology and co-tenancy

**Decision**: one Hetzner CX22-class box (2 vCPU / 4 GB), Docker Compose per application, **Caddy** as the shared reverse proxy, one shared Postgres server with a database and role per application.

```
Caddy :80/:443  (automatic TLS)
 ├── gym.<domain>      → gymtracker-web
 ├── api.gym.<domain>  → gymtracker-api
 └── <future app subdomains>

postgres:17  ── db: gymtracker   role: gymtracker  (no access to other DBs)
            └─ db: <future app>  role: <future>
```

**Why one shared Postgres**: a second Postgres container costs ~200–300 MB resident for one user's data. Separate databases and roles give isolation where it matters — a compromised app cannot read another's tables — without paying per-app memory on a 4 GB box.

**Why Caddy**: automatic certificate issue and renewal with no cron and no certbot maintenance. AR4 already puts patching and uptime on the user; TLS renewal is the easiest of those burdens to delete outright.

**Same-registrable-domain enforcement** (RK7): the API validates at startup that the configured frontend origin and its own origin share a registrable domain, and exits with a configuration error otherwise. Subdomains of the user's existing domain satisfy this by construction. The session cookie is `HttpOnly; Secure; SameSite=Lax`.

**Resource ceiling**: each app's compose stack declares memory limits so a future app cannot starve the gym tracker.

**Not designed** (AR2): backup automation, deferred by user decision. Noted here so its absence is visible rather than forgotten.

---

## 6. Recompute-history preview

**Decision**: a two-call, no-write-on-read flow.

1. `POST /equipment/:id/recompute/preview` → recomputes affected sets **in memory**, returns per-set before/after values, an affected count, and any personal records whose value or holder-set would change. Writes nothing.
2. `POST /equipment/:id/recompute/apply` with the preview's `preview_token` → re-derives the diff, compares it against the token's snapshot hash, and applies only if unchanged. Applies inside one transaction and writes a `recompute_audit` row recording what changed.

**Why the token**: without it, a preview shown and confirmed minutes later could apply a diff the user never saw. The token binds the confirmation to exactly the diff that was displayed; a mismatch forces a fresh preview.

`STACK_POSITION` sets are never in scope — they hold no mass to recompute.

---

## 7. Authentication

- **Argon2id** password hashing (memory-hard; the 4 GB box comfortably affords sane parameters for a login that happens rarely).
- `session` table: `id`, `user_id`, `expires_at`, `created_at`. Opaque random id in the cookie, 90-day expiry, sliding renewal on use. No JWT — R1's storage-eviction finding is precisely why the credential must not be script-accessible.
- Sign-in failures return one generic message regardless of whether the email exists.
- Single account: registration is a one-time seeding operation, not a public route.
- Lockout (AR1) is recoverable only by a maintenance script run on the box, as the user accepted.

---

## 8. Frontend

- Next.js 16.3.5, App Router. Server Components for history and statistics; the logging surface is a client island because it must work offline.
- Hand-rolled service worker (precache the app shell, network-first for API reads, never intercept the sync queue — the queue is application state, not a cache concern).
- Web app manifest with `display: standalone`; a first-run hint teaches Share → Add to Home Screen, since R1 confirms iOS offers no install prompt.
- `navigator.wakeLock` acquired for foreground countdowns, released on completion, dismissal, or visibility change; acquisition failure is swallowed per spec.
- Logging UI is one-handed and large-target: the user is holding a phone with chalky hands between sets.

---

## 9. Testing approach

`strict_tdd` is currently `false` (no runner existed at init). This design nonetheless requires unit tests for `resolveMass`, the aggregate-exclusion rules, and the idempotent upsert **before** the UI that consumes them, because those three carry every correctness risk in the product. Vitest for both apps; the `CHECK` constraint is verified by an integration test that attempts to insert a plate set carrying a mass and asserts rejection.

---

## 10. Open items carried to tasks

| Item | Note |
|---|---|
| Hetzner region and exact instance | user preference, no architectural impact |
| Domain and subdomain names | user owns the domain; needed before TLS |
| VAPID key generation | one-time, belongs in setup tasks |
| Device test of pocketed push (AR3) | must be an explicit task, not assumed working |
