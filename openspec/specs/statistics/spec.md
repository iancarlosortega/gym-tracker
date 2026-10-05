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
### Requirement: Days and weeks follow the phone's time zone

The system SHALL group workouts and sets into days and weeks using the time zone of the phone that asks, and SHALL keep storing every instant unchanged. A week SHALL run from local Monday 00:00 to the next local Monday 00:00.

#### Scenario: An evening workout belongs to its local day
- **GIVEN** a phone in America/Guayaquil (UTC−5)
- **WHEN** a workout starts at 20:24 local time on Sunday 4 October (01:24 UTC on Monday)
- **THEN** the week's trained days include Sunday 4 October and not Monday 5 October

#### Scenario: The week turns over at local midnight
- **GIVEN** a phone in America/Guayaquil
- **WHEN** the current week is read at 21:00 local time on Sunday
- **THEN** it is the week that began on the preceding local Monday

#### Scenario: Progress weeks start on local Mondays
- **GIVEN** a phone in America/Guayaquil and a set logged at 21:00 local time on Sunday
- **WHEN** that exercise's progression is read
- **THEN** the set counts in the week that began on the preceding local Monday

#### Scenario: A week across a clock change
- **GIVEN** a phone in Europe/Madrid
- **WHEN** the week containing the last Sunday of October is read
- **THEN** it ends at the following local Monday 00:00

#### Scenario: An unknown zone is refused
- **WHEN** statistics are requested with the time zone "Mars/Olympus"
- **THEN** the request is refused as invalid and nothing is computed
