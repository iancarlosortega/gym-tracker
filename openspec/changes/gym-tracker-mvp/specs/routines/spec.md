# Delta Spec — routines

Capability: reusable workout plans that drive a session.

## ADDED Requirements

### Requirement: User-defined routines

The system SHALL allow the user to create, reorder, rename, and archive routines composed of an ordered list of exercises.

#### Scenario: Routine preserves exercise order
- **WHEN** the user arranges four exercises in a routine
- **THEN** starting a session from that routine presents them in that order

### Requirement: Per-exercise targets within a routine

The system SHALL allow each exercise in a routine to declare a target set count, a target repetition count or range, and a rest duration.

#### Scenario: Rest duration defaults are per exercise
- **GIVEN** a routine where exercise A declares 180 seconds rest and exercise B declares 90 seconds
- **WHEN** the user completes a set of exercise B
- **THEN** the offered rest duration is 90 seconds

#### Scenario: Targets are guidance, not constraints
- **GIVEN** a routine exercise with a target of 3 sets
- **WHEN** the user logs a fourth set during the session
- **THEN** the set is accepted and recorded

### Requirement: Routine edits do not alter past sessions

The system SHALL keep completed sessions unchanged when the routine they were started from is later edited.

#### Scenario: Removing an exercise from a routine preserves history
- **GIVEN** a completed session that included exercise A
- **WHEN** exercise A is removed from the routine
- **THEN** the completed session still shows exercise A and its logged sets
