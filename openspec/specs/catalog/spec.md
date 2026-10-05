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
### Requirement: Plate-loaded equipment has an optional base weight

Plate-loaded equipment (a bar, a Smith machine, a plate-loaded machine) SHALL have a base weight that the user may leave empty, and an empty base weight SHALL NOT be counted in any total.

#### Scenario: Olympic bar counts its bar
- **GIVEN** plate-loaded "Olympic bar" with a 20 kg base weight
- **WHEN** a set of 20 kg per side is logged on it
- **THEN** the set's total is 60 kg

#### Scenario: Smith machine does not count its bar
- **GIVEN** plate-loaded "Smith machine" with no base weight
- **WHEN** a set of 20 kg per side is logged on it
- **THEN** the set's total is 40 kg

#### Scenario: Creating plate-loaded equipment without a base weight
- **WHEN** the user creates plate-loaded "Hack squat" and leaves the base weight empty
- **THEN** Hack squat is created and reads as not counting a base

### Requirement: Free weights can be loaded per hand

Free weights SHALL accept per-side exercises, read as per hand, with nothing added for a bar.

#### Scenario: Dumbbells per hand
- **GIVEN** free weights "Dumbbells"
- **WHEN** a per-side set of 60 lb per hand is logged on them
- **THEN** the set's total is 120 lb

### Requirement: A base weight can be corrected or cleared

The user SHALL be able to change or clear a base weight, and past per-side sets on that equipment SHALL be offered for recomputation before anything changes.

#### Scenario: Clearing the Smith bar
- **GIVEN** "Smith machine" with a 15 kg base weight and past sets of 20 kg per side (55 kg)
- **WHEN** the user clears the base weight and applies the preview
- **THEN** those sets read 40 kg
