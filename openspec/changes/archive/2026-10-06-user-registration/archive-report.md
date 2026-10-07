# Archive report — user-registration

Archived on 2026-10-06 at `openspec/changes/archive/2026-10-06-user-registration`.

## Final state
- **Verify:** PASS with warnings (7 requirements, 17 scenarios); see `verify-report.md`.
- **Device checks:** Ian confirmed DV.1–DV.3 on the device (2026-10-06), against the rebuilt Docker stack over Tailscale. This closes verify warning 1.
- **Commits:**
  - `35a8a0b` plan
  - `5540647` A1
  - `fda0376` and `854706c` A2
  - `c5ba50d` W1
  - `53470ea` W0
  - `47d5a92` W2
  - `160b4ab` verify
- **Owner decisions:** open registration; register design option A.

## Specs composed into openspec/specs
- **auth:**
  - "Single-account credential authentication" was replaced by "Credential authentication";
  - "Passwords are never recoverable" now also covers the register screen;
  - four requirements added: registration, one account per email, password length, rate limiting.
- **app-shell:** added "Sign-in and register link to each other".

## Open follow-ups
- `.env.example` needs `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW_SECONDS` and `TRUST_PROXY`. Ian is filling them in by hand, because the agent is denied access to that file.
- Tailscale Funnel is public, so registration can be reached from the internet. This is accepted under open registration.
- Nothing seeds a default catalog for new accounts. This was out of scope.
