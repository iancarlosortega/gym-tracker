# Delta Spec — statistics

Capability: days and weeks are cut in the phone's time zone.

## ADDED Requirements

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
