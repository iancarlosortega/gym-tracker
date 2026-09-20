# Design — gym-tracker-mvp

**Date**: 2026-09-19
**Inputs**: `proposal.md`, `preproposal.md`, `specs/*/spec.md`, `research.md`
**Purpose**: settle the four open architectural questions and the stack choices they depend on.
**Amended 2026-09-19**: §1 rewritten for strict Clean Architecture and Biome, at the user's direction.

---

## 1. Repository shape and architecture

**Decision**: a pnpm workspace monorepo, with **strict Clean Architecture applied uniformly to every feature in both apps**.

```
packages/
  domain/          pure TypeScript. ZERO framework dependencies.
    shared/           the shared kernel — building blocks used by every feature
      value-objects/    criteria.vo.ts, query-options.vo.ts, date-range.vo.ts
      errors.ts
    <feature>/
      entities/         logged-set.ts, routine.ts, exercise.ts ...
      value-objects/    grams.ts, load-entry.ts, stack-position.ts ...
      repositories/     set.repository.ts        (persistence boundaries)
      ports/            clock.port.ts, password-hasher.port.ts
      services/         resolve-mass.ts, progression.ts
  contracts/       zod schemas + wire DTO types shared across the boundary

apps/api/src/modules/<feature>/
  application/
    use-cases/     log-set.use-case.ts, recompute-history.use-case.ts
    dto/           log-set.input.ts
  infrastructure/
    persistence/   drizzle-set.repository.ts, set.mapper.ts
    adapters/      argon2-hasher.ts, web-push-sender.ts, system-clock.ts
  presentation/
    <feature>.controller.ts, <feature>.module.ts

apps/api/src/modules/<feature>/presentation/
  <action>/        one folder per endpoint:
    <action>.controller.ts
    <action>.dto.ts        (only when the endpoint takes a body or query)
    <action>.view.ts       (only when its response shape is its own)
  <feature>.http-errors.ts and anything genuinely shared by the module

apps/web/src/features/<feature>/
  application/     log-set-offline.use-case.ts, start-rest.use-case.ts
  infrastructure/  api-set.repository.ts, indexed-db-set.repository.ts
  presentation/    containers/ (stateful) + components/ (pure)
apps/web/src/app/  routes only — thin, delegating to features
```

### 1.1 Why the domain is a shared package, not a backend folder

This is forced by P1 (offline-first), not chosen for elegance. The spec requires that logging a set while offline renders immediately with no error. The resolved load must therefore be computed **on the device, with the API unreachable**. If `resolveMass` lived only in `apps/api`, the web app would need a second implementation of the single most correctness-critical function in the product, and two implementations of the same rule drift. They always drift.

So `packages/domain` is pure TypeScript with no dependency on Nest, Next, Drizzle, or IndexedDB, and both apps import it. The dependency rule here is not a philosophical commitment; it is the only arrangement in which the application works in a basement.

### 1.2 Ports are implemented on both sides

Because domain ports live in `packages/domain`, the same interface has two implementations:

| Port | Server implementation | Client implementation |
|---|---|---|
| `SetRepository` | `DrizzleSetRepository` (Postgres) | `IndexedDbSetRepository` (offline queue) |
| `Clock` | `SystemClock` | `SystemClock` |

The offline queue is therefore not a bolt-on cache — it is a repository adapter satisfying the same contract as the database. Sync becomes "drain one repository into another" rather than a special code path.

### 1.3 Uniformity is the point

Every feature receives the same four-layer shape — `domain` (in `packages/domain`), `application`, `infrastructure`, `presentation` — including features whose logic is a single row insert. This is a deliberate trade, chosen by the user: creating a routine costs more files than it strictly needs, and in exchange there is never a judgement call about where a given piece of code belongs. Predictability was ranked above brevity.

Consequence, stated plainly: the uniform shape raises the estimate from roughly 4040 changed lines across 14 slices to roughly **5140 lines across 20 slices**. That cost is accepted, not hidden.


### 1.5 Naming conventions

| Subject | Convention | Example |
|---|---|---|
| Files and directories | `kebab-case` | `logged-set.ts`, `drizzle-set.repository.ts`, `value-objects/` |
| Classes, types, interfaces, enums | `PascalCase` | `LoggedSet`, `SetRepository`, `MeasurementMode` |
| Variables, functions, methods | `camelCase` | `resolveMass`, `perSideGrams` |
| Database columns and tables | `snake_case` | `logged_set`, `resolved_grams`, `stack_position` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_REST_SECONDS` |

A file's name is the kebab-case form of its primary export: `LoggedSet` lives in `logged-set.ts`, `DrizzleSetRepository` in `drizzle-set.repository.ts`.

**Enforced mechanically**, not by discipline. Biome's `style/useFilenamingConvention` is enabled with `filenameCases: ["kebab-case"]` — the rule is off by default and must be switched on explicitly. It already understands Next.js dynamic-route syntax such as `[...slug].tsx`, so App Router files do not need an exception. Identifier casing is enforced by `style/useNamingConvention`.

The `snake_case` boundary is the database and nothing else. Mappers in `infrastructure/persistence/` are the only place where a `snake_case` column name and a `camelCase` property meet; neither the domain nor the application layer ever sees a column name.


### 1.6 Entity convention

Every entity in `packages/domain` follows the same shape. Entities carry identity and rules, so they are the one place where uniformity matters most.

- **Class, with private state.** Fields live behind a private `props` object; the instance is frozen in the constructor. There are no public fields and no setters.
- **Getters only.** Mutable values handed out — dates in particular — are copied on the way in and on the way out, so a caller cannot reach back through a reference and change the entity.
- **The constructor is private.** Instances are produced by named static factories, never by `new`.
- **Factories are named `create` and `restore`, never after a process.** `create` makes the object; `register`, `issue`, `enrol` and the like are business processes that belong to use cases, where they may later send email, publish events or seed related records. Naming an entity factory after a process steals the name the application layer will want. Variant factories keep descriptive names when they distinguish *shapes* rather than processes: `LoadEntry.total`, `LoadEntry.perSide`, `LoadEntry.stack`.
- **`create` and `restore` are different operations.** `create` records something that has just happened and starts its revision at zero. `restore` rebuilds a row that already exists and preserves its stored revision. Collapsing the two is a real bug: restoring through `create` resets the counter that orders corrections, so a replayed sync could overwrite a newer edit with an older one.
- **Invariants are enforced in the factories**, so an invalid instance cannot exist. `LoggedSet` rejects a `PER_SIDE` set whose snapshot bar weight contradicts its entry, and an ordinal set that claims a bar weight at all.
- **Identity, not value, decides equality.** `equals` compares ids. Two instances of the same set with different repetition counts are the same set; that is precisely what separates an entity from a value object.
- **Changes return a new instance.** `correctReps` produces a new `LoggedSet` at `revision + 1` and leaves the original untouched.
- **`toJSON` is the persistence shape**, consumed by the mapper in `infrastructure/persistence/`.
- **Creation factories take primitives and do the assembling.** `User.create({ email, passwordHash })` generates its own `Id`, normalises and validates the address, defaults the display unit and stamps its creation time. A use case should express intent, not assemble a valid entity field by field — every caller doing that identically is a rule waiting to be broken by the caller that does it differently.
- **Defaults belong to the entity**, not to each caller. The display unit defaults to kilograms in one place.

**Time is injected only when behaviour depends on it.** `User.create` stamps its own `createdAt` because a creation time is a record of birth that nothing branches on; an explicit value may still be passed, so an import can preserve history. `AuthSession.create` requires `now`, because expiry *is* behaviour: a test that cannot choose the current instant cannot assert when a session lapses. The line is whether a test would ever need to control the clock, not whether the entity could reach for it.

Value objects follow the same private-state-and-factories rule, but are compared by value and carry no id. `LoadEntry` keeps its three-mode discriminated union as private state so that `resolveMass` remains exhaustively checked by the compiler: adding a fourth mode is a build error, not an unhandled case.


### 1.7 Repository convention

A repository is a port, but not every port is a repository, so persistence boundaries live in `repositories/` (`set.repository.ts`) and other outbound boundaries stay in `ports/` (`clock.port.ts`, `push-sender.port.ts`).

Repositories expose a fixed set of operations — `save`, `saveMany`, `findOne`, `findMany`, `count`, `delete` — and take a **closed criteria type** rather than a method per field. `findByExercise`, `findBySession`, `findByExerciseAndWeek` is a list that never stops growing; one method per screen is not an interface, it is a backlog.

The criteria type is what keeps this honest:

- It is **not** `Partial<Entity>` and **not** a predicate or expression language. It is an explicit list of the filters this application actually uses, owned by the domain.
- Adding a filter is therefore a deliberate decision that shows up in review, instead of a caller inventing a query the domain never sanctioned.
- Because it is closed, both adapters can be held to the same contract tests: whatever `DrizzleSetRepository` answers, `IndexedDbSetRepository` must answer identically.

`Criteria<TFields>` and `QueryOptions<TSortField>` are generic classes in the shared kernel, so every repository inherits the same behaviour — `with`, `without`, `has`, `keys`, `isEmpty`, `orderedBy`, `limitedTo`, `offsetBy` — while still declaring its own closed field list. A repository writes `type SetCriteria = Criteria<SetCriteriaFields>`; the discipline is per repository, the mechanics are shared.

**Every list read is paginated, and that is structural rather than a convention.** `findMany` takes a required `Pagination`, so an unbounded query cannot be expressed through the port: forgetting to paginate is a compile error, not a slow endpoint discovered when a user has ten thousand rows.

`Pagination` defaults to 50 and clamps to 200 rather than rejecting an oversized request, so a client asking for ten thousand rows gets the maximum page and the database is never asked for the rest. Reads fetch `probeLimit` — one row more than the page needs — and `Page` drops that row while reporting `hasMore`. No total is returned: counting the whole table on every list is the cost pagination exists to avoid.

`Page` carries the total, counted with the same criteria as the items in the same call, so a client rendering page numbers can never see a count that disagrees with the rows it was given.

At the edge, one shared `PaginationDto` serves every list endpoint, so no module redeclares paging and none can quietly ship without it.

**Adapters declare two tables instead of writing the same query code.** `DrizzleRepository` owns `findOne`, `findMany` and `count`; a concrete repository supplies a condition per criteria field and a column per sort field:

```ts
protected readonly conditions: CriteriaConditions<ExerciseCriteriaFields> = {
  id: where.equals(exercise.id),
  name: where.equalsIgnoringCase(exercise.name),
  archived: where.markedBy(exercise.archivedAt)
}
```

`CriteriaConditions<TFields>` maps over the criteria type with `-?`, so every declared field must have a condition. Adding a filter without saying how it is queried is a build error rather than a filter that silently does nothing — and a filter that is ignored is worse than one that fails, because it returns confidently wrong results.

Writing stays in the concrete repository. Every aggregate has its own upsert rules — the set repository guards on revision and tombstones deletes — and a shared `save` would have to guess at them.

The Specification pattern was considered and rejected for this system: composable specifications that translate themselves to SQL are more expressive, but they amount to maintaining a small query compiler, which is disproportionate for a single-user application.


### 1.8 The shared kernel

`packages/domain/shared/` holds domain building blocks that belong to no single feature: `Criteria`, `QueryOptions`, `DateRange`, and the errors they raise. A type earns a place here only when a second feature genuinely needs it — a shared kernel that accumulates everything is just a `utils` folder with a better name.

Everything in it obeys the same rules as the rest of the domain: immutable, private state, named factories, no framework imports.


### 1.8b Configuration

Environment configuration uses `@nestjs/config` with a zod `validationSchema`, not a hand-written reader. The framework already solves loading, caching, typed access and fail-fast validation; reimplementing it produces a second, weaker version of the same thing.

Validation runs while the application is created, so a contradictory configuration stops the process before it listens. Logic that deserves its own tests stays outside the schema and is called from it — `shareRegistrableDomain` is a tested module in its own right, invoked from `superRefine`, rather than a regular expression buried in a config file.

### 1.8c Errors and their HTTP mapping

Every domain error extends `DomainError` and carries a `code`. The presentation layer maps that code to an HTTP status, so the domain never learns what a status is and the mapping never becomes an `instanceof` chain.

**Codes are grouped per feature**, and so are their mappings: `auth.http-errors.ts` lives beside the auth module, `measurement.http-errors.ts` beside measurement. A single table would grow with the whole system and belong to nobody.

**There is still one filter.** Nest dispatches exception filters by exception *type*, not by module, so several filters catching `DomainError` would not compose — the last global registration would win and the rest would be dead code. Splitting the tables gives the colocation; splitting the filters would give a bug.

The composition is what keeps it safe:

```ts
const httpErrors: HttpErrorMapping<DomainErrorCode> = {
  ...sharedHttpErrors,
  ...authHttpErrors,
  ...measurementHttpErrors
}
```

Because the result must satisfy `Record<DomainErrorCode, …>`, adding a code without mapping it is a compile error rather than a 500 found in production. An unmapped code reaching the filter at runtime is treated as a server fault and logged, never as a 400 that blames the caller.

**One controller per endpoint, in a folder named after the action.** `create-exercise/` holds its controller and its DTO together, so everything one endpoint needs is in one place and nothing else is. Several controllers may share a route prefix; Nest composes them. The alternative — one controller per resource — grows into a file where four unrelated endpoints share a constructor and every change touches all of them.

**The caller reaches a handler through a parameter decorator**, not by taking the request. `@GetUserId()`, `@GetSessionId()` and `@GetCaller()` live in `common/http/decorators/`, so no controller imports another module's request type and no controller sees more of the request than it needs. Their extractors are exported and tested directly, because a `createParamDecorator` result is awkward to exercise without a Nest context and the logic inside it is the part worth testing.

`readUserId` throws when no caller was resolved rather than returning an empty string. An empty id would scope a query to nobody and return an empty list as though that were the truth — a wrong answer is worse than an error.

Entities are never serialised directly. Each endpoint that returns something owns a view function, so a getter added for the domain's benefit cannot silently become part of the public API — and `User` carrying a password hash is exactly why.

**Requests are validated by DTOs**, not by hand. Controllers take a `class-validator` DTO and a global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`, so an unexpected field is rejected rather than ignored. Controllers state the happy path; failures travel to the filter.

### 1.9 Imports and module boundaries

Four rules, all enforced rather than remembered.

**No barrel files.** An `index.ts` that re-exports a folder hides the real dependency graph, defeats tree-shaking, and turns one import into a load of everything the barrel touches. `pnpm lint` fails when any `index.ts` exists under `packages/` or `apps/`. Import the module itself: `@domain/auth/value-objects/email.vo.js`.

**One alias prefix per package**, not a shared `@/`. The domain is consumed as source by the API's tests, so a single `@/` would mean two different roots in the same compilation and resolve to the wrong files. Each package therefore owns its prefix: `@domain/*`, `@api/*`, `@contracts/*`, with `apps/web` keeping Next's `@/*` because nothing imports its source.

**Alias specifiers carry the `.js` extension**, while relative specifiers carry `.ts`. This is not a preference — the compiler refuses the alternative:

> `error TS2877: This import uses a '.ts' extension to resolve to an input TypeScript file, but will not be rewritten during emit because it is not a relative path.`

`rewriteRelativeImportExtensions` only rewrites relative paths, so an alias must already name the file that will exist at runtime. `tsc-alias` then rewrites the alias to a relative path on emit, and the extension is already correct. Verified by loading the built output in Node.

**Cross-package imports use the package's subpath exports** and carry no extension: `@gym/domain/auth/entities/user.entity`. The `exports` map resolves them to `dist`, so no extension is needed or allowed.

### 1.4 Dependency rule

`presentation → application → domain`, and `infrastructure → domain`. Nothing in `domain` imports from any other layer or from any framework. Nest decorators, Drizzle types, zod schemas, and React never appear in `packages/domain`. Use cases depend on ports; the Nest module binds each port to its concrete adapter at composition time.

**Wiring is the container's job, not the module's.** Every use case is `@Injectable()` and names the port it needs with `@Inject(TOKEN)`; the module lists the use case by its class and binds each port with `useClass`. The tokens live in `<feature>.tokens.ts` at the module root, so a use case can name a port without importing the composition root that binds it. Drizzle repositories take `DATABASE` through their own `@Inject`ed constructor for the same reason.

**Rejected**: `useFactory` with `ConstructorParameters<typeof UseCase>[0]` per provider. It restated every constructor by hand, so the module grew faster than the feature and a reordered parameter became a silent mis-wiring instead of a compile error.

The cost is that the application layer imports `Inject` and `Injectable` from `@nestjs/common` — a port is an interface and erases at runtime, so a token has to come from somewhere. The decorator is the smallest surface that carries it, and the ports themselves stay `import type`. A class Nest resolves by its own class token must never arrive through `import type`: the emitted paramtypes hold `undefined` and the container refuses to boot.

**Tooling**: **Biome** for formatting and linting across the workspace, replacing ESLint and Prettier. One binary, one config, no plugin conflicts to reconcile between two apps, and it carries the naming rules in §1.5.

**Rejected**: two separate repositories (contract drift with no compiler to catch it); domain logic owned by the backend (breaks offline rendering per §1.1); depth-proportional-to-complexity layering (rejected by the user in favour of uniform predictability).

### 1.10 Workouts

**A session is its own bounded context**, not part of measurement. Measurement is the vocabulary of load and mass; a session is a visit to the gym. They meet at `session_id` on a logged set and nowhere else.

**A session holds no sets.** Sets are their own aggregate, written one at a time from a device that may be offline, and they are read through `SetRepository` by session id. Resuming therefore costs one row rather than everything logged in the session — which matters because resuming happens on a phone that was just unlocked at a rack.

**At most one workout is open per user.** Starting a second is refused with a conflict rather than closing the first or joining it. Two open sessions leave the client with no defensible answer to which one is current. This is not in the spec; it follows from the requirement that an unfinished session is resumable, which only has one meaning if there is only one.

**Nothing in progress answers 404**, not a null body, so the client can ask on every launch and read the absence of a workout from the status.

**Finishing is one-way** and a session cannot finish before it started. Reopening would let a later set land in a workout that had already been summarised.

## 2. Persistence and the measurement model

**Decision**: Postgres via **Drizzle ORM**.

**Why Drizzle over Prisma**: this runs on a shared 4 GB VPS hosting future apps. Prisma's query engine is an extra resident process per service; Drizzle compiles to plain SQL with no engine sidecar. Drizzle's schema is also ordinary TypeScript, so the `LoadEntry` discriminated union below is expressible directly rather than mirrored in a separate DSL.

**Rejected**: Prisma (engine footprint, DSL duplication of the mode union); TypeORM (decorator-heavy, weaker inference for discriminated unions); raw SQL (no migration story worth the savings).

### 2.0 Logging a set

**The client never names the measurement mode or the bar weight.** The mode is read from the exercise, the bar weight from the equipment, and the display unit from the account. A request that could declare its own mode could turn a plate position into kilograms, and the snapshot written onto the set would then record that lie permanently.

**Sets are posted as a batch**, between one and a hundred, to `POST /workouts/:id/sets`. A device returning from offline has a queue to drain, and a batch of one is simply the online path — one code path rather than two. The bound keeps a long drain retryable.

**A batch is validated whole before anything is written.** One bad set writes nothing, so a client never has to work out which half of its queue landed.

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

**The port owns its contract.** `describeSetRepositoryContract` lives in `packages/domain` beside `SetRepository` and is run by both adapters' test suites. A behaviour only one of them has is a behaviour synchronisation cannot rely on, so the suite pins what both promise and nothing else: delete is in it because both hide the set from every read, while the tombstone that stops a replayed create resurrecting it is Postgres-only and tested there.

**Conflict strategy**: **there is effectively no conflict to resolve.** Sets are append-only facts authored by one user on one device at a time. The realistic failure is not divergent edits but *duplicate delivery* — a set that arrived while its acknowledgement was lost. Client-generated ids make the server write idempotent: the second delivery is an upsert onto the same row, satisfying the spec's "exactly one set" scenario.

For the rarer edit/delete case, each set carries a `client_revision` counter and last-write-wins by `(client_revision, logged_at)`. Deletes are tombstoned rather than removed, so a delete cannot be resurrected by a replayed create.

**Sync drains through a gateway, not a second repository.** `SetSyncGateway.push` returns the ids the server confirmed, because a repository answers whether something is stored while synchronisation has to know whether the other side took responsibility for it. A partial acceptance then names itself and the queue keeps exactly the rest. This supersedes the earlier framing of sync as draining into an `ApiSetRepository`.

**A failed push is not an error.** Losing connectivity mid-drain is ordinary and the queue is already the record of what still has to go. A failed queue *write* is raised, because a set that was neither stored nor sent is lost.

**The client keeps no tombstones.** The queue holds pending writes only, so deleting an unsynced set is a queue drop and deleting a synced one is an online call. Only the server can be handed a replayed create for a set the user has already deleted, so only the server needs the tombstone.

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
- **shadcn/ui** for components and **lucide-react** for icons. Components are vendored into `src/components/ui`, so they are ours to edit rather than a dependency to fight; Biome's `noLabelWithoutControl` is disabled for that directory alone, because a generic `Label` primitive cannot see its consumer's `htmlFor`.
- Colour is owned by shadcn's semantic tokens. The only bespoke theme values are touch sizes — `--spacing-touch` at 3.5rem clears the 44px minimum with room for a chalky thumb. The app renders dark by default: it is read in a gym, under bad light, at arm's length.
- **The exercise and equipment pickers stay native `<select>`.** On a phone that opens the system picker, which is reachable one-handed and already accessible; a popover listbox is the better desktop control and the worse one at a rack.
- React components are arrow functions and modules export by name. `page.tsx` and `layout.tsx` are the exception, because Next resolves a route by its default export.
- Forms use **react-hook-form** with a **zod** resolver. Never `z.coerce.number()` on a field: `Number('')` is `0`, so an empty input would be reported as "more than zero" rather than as missing, and any rule weaker than `positive` would log an empty bar.
- **Runtime configuration is read at request time**, not inlined. `NEXT_PUBLIC_*` is baked in by `next build`, which would mean one image per environment; the workout route calls `connection()`, reads `process.env.API_ORIGIN`, and passes it to the client island as a prop.
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
