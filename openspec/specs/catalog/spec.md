# Delta Spec — catalog

Capability: managing exercises and equipment from the phone.

## ADDED Requirements

### Requirement: Exercises are created with how they are loaded

The web app SHALL let the user create an exercise with a name and one of three ways of loading it (total weight, per side, or pin position), each explained in plain words, and SHALL let the user rename or archive it.

#### Scenario: Creating a per-side exercise
- **WHEN** the user creates "Hip thrust" loaded per side
- **THEN** Hip thrust is listed with "per side"
- **AND** it can be picked when logging

#### Scenario: Archiving an exercise
- **WHEN** the user archives Hip thrust
- **THEN** it is no longer offered when logging or building routines
- **AND** its past sets remain in statistics

#### Scenario: Fresh account
- **GIVEN** a new account with no exercises
- **WHEN** the user opens Exercises
- **THEN** creating the first exercise is offered

### Requirement: Equipment shows its bar weight and how much it is used

The web app SHALL list equipment and, for each, show its bar weight or stack size and how many exercises and logged sets use it, and SHALL let the user rename or archive it.

#### Scenario: Equipment detail
- **GIVEN** the Smith machine with a 15 kg bar, used by 3 exercises and 46 sets
- **WHEN** the user opens it
- **THEN** it reads 15 kg, 3 exercises and 46 logged sets

### Requirement: Correcting a bar weight leads to the preview

From an equipment's detail, the web app SHALL offer to correct its bar weight and SHALL lead to the existing recompute preview before anything is changed.

#### Scenario: Reaching recompute from the app
- **WHEN** the user chooses "Correct the bar weight…" on the Smith machine
- **THEN** the recompute preview for the Smith machine opens
- **AND** no set has changed yet

### Requirement: Catalog lives with routines

Exercises and equipment SHALL be reachable from the Routines area alongside routines.

#### Scenario: Switching between routines, exercises and equipment
- **WHEN** the user is in the Routines area
- **THEN** they can switch to Exercises or Equipment in one tap
