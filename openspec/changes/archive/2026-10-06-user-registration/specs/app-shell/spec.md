# Delta Spec — app-shell

Capability: getting between signing in and registering.

## ADDED Requirements

### Requirement: Sign-in and register link to each other

The sign-in screen SHALL offer a way to the register screen, and the register screen SHALL offer a way back to sign-in. Both SHALL be reachable without a session.

#### Scenario: From sign-in to register
- **GIVEN** a visitor without a session on the sign-in screen
- **WHEN** they choose to create an account
- **THEN** the register screen is shown

#### Scenario: From register back to sign-in
- **GIVEN** a visitor on the register screen
- **WHEN** they choose to sign in instead
- **THEN** the sign-in screen is shown

#### Scenario: Where the visitor was going is kept
- **GIVEN** a visitor sent to sign-in from `/routines`
- **WHEN** they go to register and create an account
- **THEN** `/routines` is shown

#### Scenario: Register is never a destination after signing in
- **GIVEN** a register link whose `next` points at the register or sign-in screen
- **WHEN** the visitor creates an account
- **THEN** Home is shown
