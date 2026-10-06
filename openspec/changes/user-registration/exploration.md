# Exploration: user-registration

## Question
The web app has a sign-in page but no way to create an account. What does a register page need, and what does it change?

## Current state
- **Single account by design.** The canonical auth spec is "Single-account credential authentication". `openspec/config.yaml` describes the product as "Single user (the owner), explicitly not a SaaS".
- **Account creation is an operator command.** `pnpm db:seed <email> <password>` runs `apps/api/src/commands/seed-account.command.ts` → `SeedAccountUseCase`, which throws `AccountAlreadyExistsError` when any user exists (`users.count(Criteria.none())`). The comments on both say registration is deliberately not an HTTP route.
- **Data is already isolated per user.** Every data table (`exercise`, `equipment`, `routine`, `workout_session`, `push`, `recompute_audit`, `session`) carries `user_id`, and the Drizzle repositories filter by it. A second user sees none of the first user's catalog, routines, workouts or statistics. There is no migration to do.
- **Email is normalised in the domain.** `Email.create` trims and lowercases, and `app_user.email` is `UNIQUE`, so `Ian@x.com` and `ian@x.com` cannot become two accounts.
- **Sign-in resists enumeration.** An unknown address, a malformed address and a wrong password all return the same 401 (`AuthenticationFailedError`, `authHttpErrors`). The DTO validates shape only, for the same reason.
- **No rate limiting.** `@nestjs/throttler` is not installed, and `main.ts` does not set `trust proxy`.
- **Web pattern to mirror.** `app/sign-in/page.tsx` (public, outside the `(app)` group) → `SignInContainer` → `SignInUseCase(port)` → `HttpSignInGateway` (axios `apiClient`, `skipSignInRedirect: true`). `SignInForm` is RHF + zod, with a password reveal toggle and `safeNextPath(next)` after success.
- **A new user starts with an empty catalog.** Exercises and equipment are per user, and nothing seeds defaults. The owner started the same way.

## Owner decision (2026-10-06)
- **Who can register: open registration.** Anyone who can reach the URL can create an account.
  - Rejected: an invite code, and first-run-only (zero accounts).

## Consequences of open registration
1. The "single account" requirement and the seed guard go away. The seed command can stay as an operator shortcut through the same use case.
2. **Enumeration on sign-up cannot be fully avoided** without email verification, because "that email is taken" is the answer a real user needs. There is no mail service. The mitigation is a rate limit on sign-up, and on sign-in as well, since sign-in also becomes publicly reachable for more than one account.
3. A rate limit by IP needs `trust proxy` behind the deploy's reverse proxy. Otherwise every request has the proxy's IP and one user locks everyone out.
4. Passwords: today there is no policy, because the seed is typed by the owner. A public form needs a minimum. NIST 800-63B: at least 8 characters, no composition rules, a generous maximum (512 already in `SignInDto`).

## Approaches
1. **`POST /auth/sign-up` registers and signs in** (recommended). One request creates the user and sets the session cookie, using the same session path as sign-in. The web flow is register → home, with no second step.
2. Sign-up returns 201 and the client then calls sign-in. That is two round trips and a window where the account exists but the user is not signed in.

## Risks
- A spam signup that fills the DB. Rate limiting bounds it, and data is per user, so other users are unaffected.
- `config.yaml` context and the `User` entity doc ("the single account") become stale. Update them in the change.
