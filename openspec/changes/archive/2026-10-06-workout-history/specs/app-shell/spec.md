# Delta Spec — app-shell

Capability: reaching workout history.

## ADDED Requirements

### Requirement: History is reachable from Progress, Home and Profile

History SHALL be a view inside Progress, and Home and Profile SHALL each link to it. While History or a workout from it is open, the Progress tab SHALL be marked as current.

#### Scenario: From Progress
- **WHEN** the user opens Progress
- **THEN** they can switch to History in one tap

#### Scenario: From Home
- **WHEN** the user taps the History link on Home
- **THEN** History opens
- **AND** the Progress tab is marked as current

#### Scenario: From Profile
- **WHEN** the user taps History on Profile
- **THEN** History opens
