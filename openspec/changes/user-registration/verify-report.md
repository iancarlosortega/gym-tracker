# Verify report — user-registration

**Verdict: PASS with warnings.** 7 requirements, 17 scenarios. Checked against the spec scenarios, not the implementation. Run inline on 2026-10-06 at `47d5a92`.

## Evidence
- `pnpm test`: domain 242, api 336, web 534 — all pass.
- `pnpm typecheck`: pass. `biome check .`: clean. `next build`: ok, and `/register` is in the route list.

## auth
| Scenario | Evidence | Status |
|---|---|---|
| Registering signs the new user in | `sign-up.controller.test` (201 + HttpOnly `gym_session`). `SignUpContainer` → `router.replace(safeNextPath(next))` | ✅ |
| A new account starts empty | No new test. Covered by the existing per-user scoping tests (statistics, routine history, workout history, last sets: "another user is excluded") | ⚠️ DV.1 |
| The new account can sign in later | `sign-in.use-case.test`: registers through `RegisterAccountUseCase`, then signs in | ✅ |
| A taken email is refused with a way forward | `register-account.use-case.test` (case and spacing), PGlite unique-violation test, controller 409, `sign-up-form.test` ("Sign in instead" link carrying `next`) | ✅ |
| An unusable email is refused | Use-case `InvalidEmailError` (400 via the existing mapping), plus the client-side zod check | ✅ |
| A short password is refused | `password-policy.service.test` (7 / 8 / 512 / 513), `sign-up-form.test` ("Use at least 8 characters.") | ✅ |
| A long passphrase without symbols is accepted | `password-policy.service.test` | ✅ |
| Too many attempts are refused for a while | Sign-up and sign-in controller tests: 6th request → 429 with `Retry-After` | ✅ |
| One client's limit does not block another | Sign-up controller test: a different forwarded IP gets 201 | ✅ (keying shared by sign-in) |
| Correct credentials authenticate / incorrect refused without enumeration | Existing sign-in tests, unchanged | ✅ |
| No reset path on sign-in or register | `sign-in-form.test` ("offers no way to recover a password"). The register form has no such control, but no test asserts it | ⚠️ |
| Stored credentials cannot be reversed | `register-account.use-case.test` (the hash does not contain the plaintext) | ✅ |

## app-shell
| Scenario | Evidence | Status |
|---|---|---|
| From sign-in to register | `sign-in-form.test` ("Create an account" link) | ✅ |
| From register back to sign-in | `sign-up-form.test` ("Sign in" link) | ✅ |
| Where the visitor was going is kept | `authPageFor` tests. Both containers pass `next` through; there are no container tests, which matches sign-in | ✅ |
| Register is never a destination after signing in | `sign-in-redirect.test` (register route, with a query or a trailing segment) | ✅ |

## Warnings
1. **Device checks DV.1–DV.3 are still pending.** They need Ian's phone and a rebuilt Docker stack.
2. **"New account starts empty"** relies on the existing per-user scoping tests and has no end-to-end test of its own.
3. **`.env.example`** still lacks `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW_SECONDS` and `TRUST_PROXY`. The agent is denied access to that file; `compose.yaml` has the defaults.
4. **Tailscale Funnel is public.** With open registration live, anyone with the URL can register. This is the intended product decision, but worth Ian's awareness.
5. **Budget:** A2 (500 lines) and W2 (670 lines) went over 400. Both are recorded as ledger resets: A2 under Ian's autonomous waiver, W2 after his local review.

## Deviations from the design (accepted)
- A 400 maps to `SignUpRejectedError(server message)`, not a dedicated `WeakPasswordError`, because API error bodies carry no domain code.
- `SignUpDto` caps the password at 2048, so the 512 limit is enforced by the domain policy and its message.
- The policy is `checkPasswordPolicy` (a function in `auth/services`), matching the domain's other services.
