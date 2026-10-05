# Delta Spec — display-unit

Capability: the user's choice of pounds or kilograms.

## ADDED Requirements

### Requirement: The user chooses pounds or kilograms

The web app SHALL let the user choose lb or kg on Profile, and SHALL remember the choice on the server.

#### Scenario: Switching to pounds
- **WHEN** the user chooses lb on Profile
- **THEN** Profile shows lb as chosen after the app reopens

### Requirement: Logging reads and writes in the chosen unit

The keypad, the value tiles, last time, done sets and equipment base weights SHALL be entered and shown in the chosen unit, and existing history SHALL be shown converted.

#### Scenario: Logging in pounds
- **GIVEN** the user chose lb
- **WHEN** they enter 60 per hand on Dumbbells and log it
- **THEN** the done set reads "120 lb × reps"

#### Scenario: History logged in kilograms
- **GIVEN** a set logged as 60 kg total before switching
- **WHEN** the user views it with lb chosen
- **THEN** it reads "132.3 lb"
### Requirement: Progress and recompute read in the chosen unit

Progress charts, their weekly list, and the recompute preview's records and set changes SHALL show weights in the chosen unit and SHALL name that unit.

#### Scenario: Progress in pounds
- **GIVEN** the user chose lb and Bench's best week was 100 kg
- **WHEN** they open Bench's progress
- **THEN** the chart and the weekly list read 220.5 lb
- **AND** the chart says its values are in lb

#### Scenario: Recompute preview in pounds
- **GIVEN** the user chose lb and correcting a bar from 20 kg to 15 kg changes a record from 100 kg to 95 kg
- **WHEN** the preview is shown
- **THEN** the record reads 220.5 lb → 209.4 lb
- **AND** each changed set names lb on both sides
