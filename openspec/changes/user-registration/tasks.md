# Tasks — user-registration

Strict TDD (red → green → refactor). Each unit is a commit to main once `pnpm test`, `pnpm typecheck`, `biome check .` and the build pass. Units are sliced for the 400-line budget (auto-chain).

## A1 — Domain + API: register account
- [x] 1.1 `checkPasswordPolicy` (`auth/services/password-policy.service.ts`) (8–512 characters, no composition rules) and `WeakPasswordError` (`WEAK_PASSWORD`). Tests cover 7, 8, 512 and 513 characters and a spaced passphrase.
- [x] 1.2 `EmailAlreadyRegisteredError` (`EMAIL_ALREADY_REGISTERED`). Remove `AccountAlreadyExistsError` / `ACCOUNT_ALREADY_EXISTS`. Update the `User` doc ("the single account").
- [x] 1.3 `RegisterAccountUseCase` (D1), with in-memory tests: success, a taken email in different case and with spaces, an invalid email, a weak password. Delete `SeedAccountUseCase`; `seed-account.command.ts` uses the new use case.
- [x] 1.4 `DrizzleUserRepository.save` maps a unique violation to `EmailAlreadyRegisteredError` (PGlite test).

## A2 — API: sign-up endpoint, session issuer, rate limit
- [ ] 2.1 Extract `SessionIssuer` from `SignInUseCase` (D2). The sign-in tests stay green unchanged.
- [ ] 2.2 `SignUpDto` (shape only: email up to 320, password up to 512) and `SignUpController` `POST /auth/sign-up` → 201 + `gym_session` cookie. `authHttpErrors`: 409 and 400 mappings.
- [ ] 2.3 `@nestjs/throttler` with the named `auth` throttler on sign-in and sign-up (D4). Add the `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW_SECONDS` and `TRUST_PROXY` env vars to the schema and `.env.example`, and `app.set('trust proxy')`. Supertest: a 6th request → 429 with `Retry-After`; another forwarded IP is unaffected.

## W0 — Design options (before W2)
- [ ] 0.1 Publish register-page design options as artifacts, in the sign-in page's visual language, and wait for Ian's pick ([[gymtracker-design-explorations]]).

## W1 — Web: sign-up logic
- [ ] 1.1 `SignUpPort`, `SignUpUseCase` (trims the email), and the `EmailTakenError`, `WeakPasswordError` and `RateLimitedError` errors.
- [ ] 1.2 `HttpSignUpGateway`: 409 / 400 / 429 mapping, `skipSignInRedirect`. Tests with a mocked axios instance.
- [ ] 1.3 `safeNextPath` rejects `/register` (also with `?` and `/` variants). The sign-in gateway maps 429 → `RateLimitedError`.

## W2 — Web: register page and links
- [ ] 2.1 `SignUpForm` (RHF + zod, reveal toggle, `new-password`), following the chosen design. RTL tests: min-length message, taken message with a sign-in link, pending disables submit, a 429 message.
- [ ] 2.2 `SignUpContainer` and `app/register/page.tsx`: on success, `router.replace(safeNextPath(next))`.
- [ ] 2.3 Sign-in page: a "Create an account" link carrying `next`, plus the 429 message. Bump the service worker cache version.
- [ ] 2.4 `openspec/config.yaml` context: multi-user, open registration.

## Device verification
- [ ] DV.1 Register a second account on the phone. Home is empty and the owner's data is not visible. Sign out, then sign back in.
- [ ] DV.2 Try the owner's email on register: the taken message appears, and its link goes to sign-in.
- [ ] DV.3 Behind the deploy proxy: 6 quick failed sign-ins → wait message. Another device can still sign in.

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| A1 | ~250 |
| A2 | ~350 |
| W0 | 0 (artifact) |
| W1 | ~220 |
| W2 | ~330 |

Chained PRs recommended: Yes (5 units, ~1150 lines). 400-line budget risk: Low per unit. Decision needed before apply: No (auto-chain; commits to main, no PRs).
