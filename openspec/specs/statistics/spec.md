# Delta Spec — statistics

Capability: turning logged sets into honest progress figures.

## ADDED Requirements

### Requirement: Mass-based aggregates exclude ordinal exercises

The system SHALL exclude every `STACK_POSITION` set from any aggregate expressed in units of mass, including total volume, tonnage, and average load.

#### Scenario: Plate sets are excluded from total volume
- **GIVEN** a week containing two `TOTAL` sets and three `STACK_POSITION` sets
- **WHEN** total volume for that week is computed
- **THEN** only the two `TOTAL` sets contribute to the figure

#### Scenario: A mass aggregate over only ordinal sets returns no value
- **GIVEN** a week containing only `STACK_POSITION` sets
- **WHEN** total volume for that week is computed
- **THEN** the system returns an explicit "not applicable" result rather than zero

### Requirement: Excluded sets are disclosed, not hidden

The system SHALL state, alongside any mass-based aggregate, how many sets were excluded because they use an ordinal mode.

#### Scenario: Exclusion count is surfaced
- **GIVEN** a week where three sets were excluded from total volume
- **WHEN** the user views that week's total volume
- **THEN** the view states that three sets were excluded as ordinal

### Requirement: Per-exercise progression is available for every mode

The system SHALL provide per-exercise progression over time for exercises in all three measurement modes, using resolved mass for ratio modes and the ordinal value for `STACK_POSITION`.

#### Scenario: Plate-mode exercise has its own progression
- **GIVEN** a plate-mode exercise logged at ordinals 5, 6, then 7 across three weeks
- **WHEN** the user views that exercise's progression
- **THEN** the progression shows the ordinal series 5, 6, 7
- **AND** the series is labelled as plate positions rather than a mass unit

### Requirement: Week-over-week comparison compares like with like

The system SHALL compare a week to another week only within the same exercise and the same measurement mode.

#### Scenario: Mode change breaks the comparison chain
- **GIVEN** an exercise logged in `STACK_POSITION` in week 1 and in `TOTAL` in week 2
- **WHEN** week-over-week progress for that exercise is computed
- **THEN** the system reports the mode change and does not present a single continuous trend
