# Delta Spec — catalog

Capability: what a piece of equipment adds to a per-side load.

## MODIFIED Requirements

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
