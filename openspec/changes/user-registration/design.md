# Design: User registration

## Technical Approach
`POST /auth/sign-up` creates the account and returns the same session cookie as sign-in. The web side mirrors the sign-in slice. `@nestjs/throttler` guards both public auth routes. No migration: `app_user.email` is already `UNIQUE`, and data is already scoped by `user_id`.

## Architecture Decisions

### D1: `RegisterAccountUseCase` replaces `SeedAccountUseCase`
**Choice**:
- `RegisterAccountUseCase.execute({ email, password })` → `User`:
  - `Email.create(email)`; an invalid address throws `InvalidEmailError`, mapped to 400.
  - `PasswordPolicy.check(password)` (domain, 8–512 characters); a failure throws `WeakPasswordError` (`WEAK_PASSWORD`), mapped to 400.
  - `users.findOne({ email })` exists → `EmailAlreadyRegisteredError` (`EMAIL_ALREADY_REGISTERED`), mapped to 409.
  - Otherwise `hasher.hash` → `User.create` → `users.save`.
- The repository save also maps a unique-violation to `EmailAlreadyRegisteredError`, so two concurrent sign-ups with one email cannot both pass.
- `AccountAlreadyExistsError` / `ACCOUNT_ALREADY_EXISTS` and `SeedAccountUseCase` are removed. `seed-account.command.ts` calls the new use case.

**Alternatives**: keep the seed use case and add a separate one. Two ways to create a user would drift on the password policy.

**Rationale**: one creation path. The policy lives in the domain, so the command, the API and tests share it.

### D2: Session issuance is extracted from sign-in
**Choice**: a `SessionIssuer` application service (`issue(userId) → { sessionId, expiresAt }`), using `AuthSession.create`, the clock, the policy and `sessions.save`. `SignInUseCase` and `SignUpController` both use it. The controller runs register, then issue, then sets the cookie through the existing `sessionCookieOptions`.

**Alternatives**: `RegisterAccountUseCase` returns a session itself. That mixes two responsibilities, and the seed command would create a pointless session.

**Rationale**: the cookie path stays identical to sign-in's, so lifetime, Secure and SameSite cannot diverge.

### D3: "Email taken" is explicit; sign-in stays non-enumerating
**Choice**: a 409 with the message "An account with that email already exists." The web side shows it inline, with a link to `/sign-in?next=…`. Sign-in keeps its single 401.

**Alternatives**: a generic "Could not create the account". That is useless to a real user, and the 409 status still leaks. "Check your email" would need mail infrastructure, which is out of scope.

**Rationale**: accepted trade-off (proposal, Risks). The rate limit (D4) bounds how fast addresses can be probed.

### D4: Rate limit with `@nestjs/throttler`, per IP, on auth routes only
**Choice**:
- `ThrottlerModule.forRoot` with a named `auth` throttler: `AUTH_RATE_LIMIT` (default 5) per `AUTH_RATE_WINDOW_SECONDS` (default 60), using in-memory storage.
- `@UseGuards(ThrottlerGuard)` and `@Throttle` apply to `SignInController` and `SignUpController` only, so the app-wide routes are unaffected.
- Over the limit → 429 with a `Retry-After` header.
- `main.ts` calls `app.set('trust proxy', TRUST_PROXY)`. `TRUST_PROXY` is a new env var (default `false` in development, set to the hop count in deploy), validated in `environment.schema`.

**Alternatives**:
- A hand-rolled counter. That is more code for the same result.
- Redis storage. The deploy is single-instance, so it is not needed yet.

**Rationale**: the official Nest module, it scales to the deploy's size, and the configuration stays explicit. A supertest test pins that the key is the `X-Forwarded-For` client IP when `trust proxy` is set.

### D5: Web: a parallel `sign-up` slice, plus a shared credentials form base
**Choice**:
- `features/auth/application`: `sign-up.port.ts`, `sign-up.use-case.ts` (trims the email), `email-taken.error.ts`, `weak-password.error.ts`.
- `features/auth/infrastructure/http-sign-up.gateway.ts`: `POST /auth/sign-up` with `skipSignInRedirect`. 409 → `EmailTakenError`, 400 → mapped by message code, 429 → `RateLimitedError` (shared with sign-in).
- `presentation/components/sign-up-form.tsx`: RHF + zod (`email`, `password.min(8).max(512)`), with the reveal toggle and `autoComplete="new-password"`.
- `presentation/containers/sign-up.container.tsx`, and the route `app/register/page.tsx` (public, outside `(app)`).
- `safeNextPath` also rejects `/register`. The links between the two pages carry `next`.
- Sign-in gains a 429 message ("Too many attempts. Wait a minute and try again.").

**Rationale**: matches [[gymtracker-web-stack]] and the container-presentational split. Each side stays small enough to read whole.

### D6: Design options before the page
**Choice**: task W0 publishes register-page options. The visual design follows Ian's pick; the logic tasks do not wait on it.

## Data Flow
```
RegisterPage → SignUpContainer → SignUpUseCase → HttpSignUpGateway
  → POST /auth/sign-up [ThrottlerGuard] → SignUpController
     → RegisterAccountUseCase (Email, PasswordPolicy, unique) → users.save
     → SessionIssuer.issue → Set-Cookie gym_session
  ← 201 → router.replace(safeNextPath(next))
```

## File Changes
| File | Action |
|---|---|
| `packages/domain/src/auth/password-policy.ts` (+test) | Create |
| `packages/domain/src/auth/errors.ts`, `shared/errors/domain-error.ts` | Modify (add `WEAK_PASSWORD`, `EMAIL_ALREADY_REGISTERED`; drop `ACCOUNT_ALREADY_EXISTS`) |
| `packages/domain/src/auth/entities/user.entity.ts` | Modify (doc only) |
| `apps/api/.../use-cases/register-account.use-case.ts` (+test) | Create; delete `seed-account.use-case.ts` |
| `apps/api/.../application/services/session-issuer.service.ts` (+test) | Create; `sign-in.use-case.ts` uses it |
| `apps/api/.../presentation/sign-up/sign-up.{controller,dto}.ts` (+tests) | Create |
| `apps/api/.../presentation/auth.http-errors.ts` | Modify |
| `apps/api/.../drizzle-user.repository.ts` | Modify (unique violation → domain error) |
| `apps/api/src/app.module.ts`, `main.ts`, `config/environment.schema.ts` | Modify (throttler, trust proxy, env) |
| `apps/api/src/commands/seed-account.command.ts` | Modify |
| `apps/web/src/features/auth/**` sign-up slice | Create |
| `apps/web/src/app/register/page.tsx` | Create |
| `sign-in-form.tsx`, `sign-in-redirect.ts`, `sign-in/page.tsx` | Modify (link, 429, `/register` excluded) |
| `openspec/config.yaml` | Modify (context: multi-user) |

## Testing Strategy
Strict TDD:
- Domain: `PasswordPolicy` boundaries at 7, 8, 512 and 513 characters.
- Use case: in-memory repository, covering taken (case and space variants), invalid email and weak password.
- Repository: a PGlite unique-violation test.
- Controller: supertest covering 201 with a cookie, 409, 400, 429 after 5 requests, and the forwarded IP keying.
- Web: use case and gateway status mapping, `safeNextPath`, and RTL for the form (validation, taken message with a sign-in link, pending state).

## Open Questions
None blocking. The orchestrator's defaults are listed in the proposal under "Owner decisions".
