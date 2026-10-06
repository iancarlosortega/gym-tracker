# Apply progress — user-registration

Applied inline (the hook refuses sdd-* sub-agents). Strict TDD. Ian waived review until W0 design options (2026-10-06).

## A1 — Domain + API: register account (done)
- `checkPasswordPolicy` in `packages/domain/src/auth/services/password-policy.service.ts`. The domain's services are functions, so this is one too. It counts code points; the bounds are 8 and 512.
- `EmailAlreadyRegisteredError` (409) and `WeakPasswordError` (400, with a fixed message, because `HttpErrorMapping` takes no arguments) replace `AccountAlreadyExistsError`.
- `RegisterAccountUseCase` returns the created `User`. It checks the email, then the policy, then uniqueness. `SeedAccountUseCase` is deleted; the seed command and `AuthModule` exports use the new use case.
- `DrizzleUserRepository.save` maps SQLSTATE 23505 to `EmailAlreadyRegisteredError`, with a PGlite test.
- The sign-in tests now register through the new use case. The stale `toThrow(AccountAlreadyExistsError)` passed vacuously and was removed.
- Evidence: `pnpm test` (domain 242, api 324, web 509) green, `pnpm typecheck` green, `biome check .` clean, api build ok.
