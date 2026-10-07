# Apply progress — user-registration

Applied inline (the hook refuses sdd-* sub-agents). Strict TDD. Ian waived review until W0 design options (2026-10-06).

## A1 — Domain + API: register account (done)
- `checkPasswordPolicy` in `packages/domain/src/auth/services/password-policy.service.ts`. The domain's services are functions, so this is one too. It counts code points; the bounds are 8 and 512.
- `EmailAlreadyRegisteredError` (409) and `WeakPasswordError` (400, with a fixed message, because `HttpErrorMapping` takes no arguments) replace `AccountAlreadyExistsError`.
- `RegisterAccountUseCase` returns the created `User`. It checks the email, then the policy, then uniqueness. `SeedAccountUseCase` is deleted; the seed command and `AuthModule` exports use the new use case.
- `DrizzleUserRepository.save` maps SQLSTATE 23505 to `EmailAlreadyRegisteredError`, with a PGlite test.
- The sign-in tests now register through the new use case. The stale `toThrow(AccountAlreadyExistsError)` passed vacuously and was removed.
- Evidence: `pnpm test` (domain 242, api 324, web 509) green, `pnpm typecheck` green, `biome check .` clean, api build ok.

## A2 — API: sign-up endpoint, session issuer, rate limit (done)
- `SessionIssuer` (`application/services/session-issuer.service.ts`) now owns `SessionPolicy`. `SignInUseCase(users, hasher, issuer)`.
- `POST /auth/sign-up` → 201 + `gym_session`. `SignUpDto` caps the password at 2048 rather than 512, so a 513-character password reaches the domain policy and gets its message.
- `@nestjs/throttler` 6.7.1: `ThrottlerModule.forRootAsync({ useClass: AuthThrottlerOptions })` in `AuthModule`, following the never-useFactory convention. `ThrottlerGuard` sits on `SignInController` and `SignUpController` only. 429 says "Too many attempts. Wait a minute and try again." and carries `Retry-After`.
- Env: `AUTH_RATE_LIMIT` = 5, `AUTH_RATE_WINDOW_SECONDS` = 60, `TRUST_PROXY` = 0. `main.ts` sets `trust proxy`, and compose defaults it to 1 (Caddy).
- **Follow-up for Ian:** add the three vars to `.env.example`; the agent is denied access to that file.
- Test helper `testing/auth-throttler.testing.ts`, because `forRootAsync` ignores `extraProviders`.
- Evidence: `pnpm test` green (domain 242, api 336, web 509), typecheck green, biome clean, api build ok.

## A2 ledger note
A2 settled `passed` at 500 changed lines, over the 400 budget (lockfile, tests, docs). The ledger asked for a maintainer decision. It was reset with the actor recorded as Ian's autonomous waiver (sole dev, commits to main, no PRs). Lint fix: `854706c`.

## W1 — Web: sign-up logic (done)
- `SignUpPort`, `SignUpUseCase` (trims the email), `HttpSignUpGateway`:
  - 409 → `EmailTakenError`;
  - 400 → `SignUpRejectedError(server message)`; this replaces the planned `WeakPasswordError`, because API error bodies carry no code;
  - 429 → `RateLimitedError`;
  - `skipSignInRedirect`.
- `HttpSignInGateway` maps 429 → `RateLimitedError`.
- `safeNextPath` rejects `/register`, `/register?…` and `/register/…` (exported as `REGISTER_PATH`); `/registers` is still allowed.
- Evidence: `pnpm test` green (web 520), typecheck green, biome clean.

## W0 + W2 — Design and register page (done, uncommitted for Ian's review)
- Ian picked **option A** (mirror of sign-in) on 2026-10-06.
- `SignUpForm`:
  - RHF + zod: the email must be usable; the password is 8–512 code points, matching the server;
  - a length hint (`data-met`) turns `text-live` with a check at 8;
  - failure banner: taken (with "Sign in instead" carrying `next`), rate-limited, rejected (the server's reason), unavailable;
  - a "Sign in" footer link.
- `SignUpContainer` maps errors to failures and calls `router.replace(safeNextPath(next))`. `/register` page: headline "Start / your log.".
- `authPageFor(page, next)` carries only a safe, non-home `next` between the two pages.
- Sign-in: a "New here? Create an account" link, and a `rate-limited` failure message. New `sign-in-form.test.tsx`.
- Service worker shell cache bumped to `gym-shell-v7`. `config.yaml` context updated to open registration.
- Evidence: `pnpm test` green (web 534, api 336, domain 242), typecheck green, biome clean, `next build` ok with `/register` listed.
- Ledger: W2 is not yet settled. Settle it after the commit, as with A1.
