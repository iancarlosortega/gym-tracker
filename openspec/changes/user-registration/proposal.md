# Proposal: User registration

## Intent
Accounts can only be created with `pnpm db:seed`, and only one. Ian wants a register page so other people can create their own account from the app (owner, 2026-10-06: open registration). Data is already scoped per user, so this is an auth and UI change, not a data-model change.

## Scope
### In Scope
- **Register page** at `/register`. It is public and has email, password and a reveal toggle, matching the sign-in page's look. Each page links to the other.
- **`POST /auth/sign-up`**: creates the account and signs the user in, setting the same HttpOnly session cookie as sign-in. Success goes to Home (or a safe `next`).
- **Password policy**: 8 to 512 characters, no composition rules (NIST 800-63B). Checked on both client and server.
- **Email taken**: the user is told plainly that an account with that email exists, with a link to sign in. This reveals which emails are registered. That is accepted and bounded by the rate limit (see Risks).
- **Rate limiting** on `POST /auth/sign-up` and `POST /auth/sign-in`, per client IP. `trust proxy` is set so the client IP is the real one.
- **Seed command**: kept as an operator shortcut and backed by the same registration use case. The "only one account" guard is removed.
- Stale "single account" wording is updated in `openspec/config.yaml` and the `User` entity doc.

### Out of Scope
- Email verification, password reset, and changing email or password. The "Passwords are never recoverable" requirement stays.
- Invite codes, admin approval, account deletion.
- A default catalog for new users. They start empty, like the owner did.
- CAPTCHA or bot detection beyond the rate limit.
- Terms of service and a privacy page.

## Capabilities
### Modified Capabilities
- `auth`:
  - "Single-account credential authentication" becomes "Credential authentication" (one account per email);
  - new requirements for registration, the password policy and rate limiting;
  - "No reset path" also covers the register page.
- `app-shell`: the sign-in and register screens link to each other, and both are reachable without a session.

## Approach
Approach 1 from the exploration. `RegisterAccountUseCase` (domain-validated email, policy-checked password, unique email) creates the user, then the existing sign-in session path issues the cookie. `@nestjs/throttler` guards the two public auth routes. The web side mirrors the sign-in slice: page → container → use case → port → HTTP gateway → RHF + zod form. A design-options step comes before the page is built ([[gymtracker-design-explorations]]).

## Risks
- **Email enumeration on sign-up.** This is the trade-off of open registration without email verification. Mitigation: the rate limit, and sign-in stays non-enumerating.
- **A wrong proxy setting** makes the rate limit global, so one abuser blocks everyone. Mitigation: `trust proxy` comes from config, and a test pins how the IP is read.
- **Product framing** changes from single user to multi-user. No data migration is needed: the owner's account and data are untouched.

## Owner decisions
- Who registers: **open** (Ian, 2026-10-06).
- Defaults the orchestrator chose; Ian can override them at review:
  - sign up also signs in;
  - "email taken" is shown explicitly;
  - the password is 8 to 512 characters;
  - the rate limit is 5 requests per minute per IP on each auth route;
  - the seed command is kept.
