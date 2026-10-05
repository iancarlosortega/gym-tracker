# Delta Spec — auth

Capability: leaving the account on this phone.

## ADDED Requirements

### Requirement: The user can sign out

The web app SHALL let the signed-in user sign out from their profile, which ends the session on the server and returns them to the sign-in screen.

#### Scenario: Signing out
- **GIVEN** a signed-in user on Profile
- **WHEN** they choose Sign out
- **THEN** the session ends
- **AND** the sign-in screen is shown
- **AND** returning to a previous screen requires signing in again

#### Scenario: Profile shows who is signed in
- **WHEN** the user opens Profile
- **THEN** it shows the signed-in email
- **AND** it shows how many sets on this phone are still waiting to sync
