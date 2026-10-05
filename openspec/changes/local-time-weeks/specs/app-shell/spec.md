# Delta Spec — app-shell

Capability: Home reads days in local time.

## ADDED Requirements

### Requirement: Home reads days in local time

Home's week strip and the "Last done" labels SHALL use the phone's local days.

#### Scenario: Last done this evening
- **GIVEN** a phone in America/Guayaquil and Push day last started at 20:24 local time today
- **WHEN** Home is shown at 21:37 local time
- **THEN** Push day reads "Last done today"
- **AND** today is marked as trained in the week strip
