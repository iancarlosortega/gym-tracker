# Delta Spec — catalog

Capability: user-defined exercises and equipment, including the parameters that make load resolution possible.

## ADDED Requirements

### Requirement: User-defined exercises

The system SHALL allow the user to create, rename, and archive exercises, and SHALL require each exercise to declare a default measurement mode.

#### Scenario: Exercise is created with a default mode
- **WHEN** the user creates an exercise and selects `PER_SIDE` as its default mode
- **THEN** the exercise is stored with that default mode

#### Scenario: Exercise without a default mode is rejected
- **WHEN** the user attempts to create an exercise without selecting a measurement mode
- **THEN** the system rejects the creation

#### Scenario: Archiving preserves history
- **GIVEN** an exercise with logged sets
- **WHEN** the user archives that exercise
- **THEN** the exercise no longer appears when building routines
- **AND** its existing sets remain intact and visible in history

### Requirement: User-defined equipment

The system SHALL allow the user to define equipment, where equipment used with `PER_SIDE` exercises declares a bar weight and equipment used with `STACK_POSITION` exercises declares the number of available stack positions.

#### Scenario: Barbell equipment declares a bar weight
- **WHEN** the user creates equipment intended for `PER_SIDE` use without a bar weight
- **THEN** the system rejects the creation and states that a bar weight is required

#### Scenario: Stack equipment declares its range
- **WHEN** the user creates stack equipment with 15 positions
- **THEN** entries above position 15 for that equipment are rejected

### Requirement: Equipment edits do not rewrite history by default

The system SHALL apply an equipment change only to sets logged after that change, leaving previously logged sets resolved as they were at log time.

#### Scenario: Correcting a bar weight leaves past sets unchanged
- **GIVEN** sets logged against a 20 kg bar weight
- **WHEN** the user corrects that equipment's bar weight to 15 kg
- **THEN** the previously logged sets still report their original resolved totals
- **AND** sets logged afterwards resolve using 15 kg

### Requirement: History recomputation is explicit and previewed

The system SHALL provide an explicit action to recompute historical sets against current equipment parameters, and SHALL present the resulting changes for confirmation before applying them.

#### Scenario: Preview precedes any change
- **GIVEN** a corrected bar weight affecting 40 historical sets
- **WHEN** the user starts a history recomputation
- **THEN** the system shows how many sets would change and what their before and after values are
- **AND** no stored set is modified until the user confirms

#### Scenario: Declining the preview changes nothing
- **GIVEN** a recomputation preview is displayed
- **WHEN** the user declines it
- **THEN** every historical set retains its original resolved value

#### Scenario: Confirmed recomputation reports personal-record impact
- **GIVEN** a recomputation that would change a personal record for an exercise
- **WHEN** the preview is displayed
- **THEN** the affected personal record is identified explicitly in the preview
