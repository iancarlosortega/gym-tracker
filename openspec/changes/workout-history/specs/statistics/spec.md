# Delta Spec — statistics

Capability: statistics follow corrections and deletions.

## ADDED Requirements

### Requirement: Statistics reflect corrected and deleted sets

Every statistic SHALL use a set's corrected values, and SHALL leave out deleted sets and deleted workouts, from the next read on.

#### Scenario: A corrected best set
- **GIVEN** Bench's best set this week is 80 kg × 5
- **WHEN** it is corrected to 70 kg × 5
- **THEN** Bench's progression for this week reads 70 kg

#### Scenario: A deleted set leaves the totals
- **GIVEN** this week has 30 sets
- **WHEN** one is deleted
- **THEN** the week reads 29 sets

#### Scenario: A deleted workout leaves the week
- **GIVEN** this week has 3 workouts
- **WHEN** one of them is deleted
- **THEN** the week reads 2 workouts and its day is no longer marked as trained
