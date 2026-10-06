# Delta Spec — measurement

Capability: representing and resolving the load of a logged set across incompatible measurement modes.

## ADDED Requirements

### Requirement: Measurement modes are explicit and closed

The system SHALL support exactly three measurement modes — `TOTAL`, `PER_SIDE`, and `STACK_POSITION` — and SHALL require every load entry to declare exactly one of them.

#### Scenario: Entry without a mode is rejected
- **WHEN** a load entry is submitted with no measurement mode
- **THEN** the system rejects it and records no set

#### Scenario: Unknown mode is rejected
- **WHEN** a load entry declares a mode outside the three supported modes
- **THEN** the system rejects it and records no set

### Requirement: PER_SIDE resolves using the equipment's bar weight

The system SHALL resolve a `PER_SIDE` entry to a total mass of `(entry × 2) + (base_weight ?? 0)`, where `base_weight` is the optional base weight of the equipment referenced by the set. An empty base weight is not counted (see catalog: "Plate-loaded equipment has an optional base weight" and "Free weights can be loaded per hand").

#### Scenario: Standard barbell resolution
- **GIVEN** an exercise referencing equipment with a bar weight of 20 kg
- **WHEN** the user logs a `PER_SIDE` entry of 20 kg
- **THEN** the resolved total load is 60 kg

#### Scenario: Non-standard bar resolution
- **GIVEN** an exercise referencing equipment with a bar weight of 10 kg
- **WHEN** the user logs a `PER_SIDE` entry of 15 kg
- **THEN** the resolved total load is 40 kg

#### Scenario: PER_SIDE without a base weight counts no base
- **GIVEN** an exercise whose equipment defines no base weight
- **WHEN** the user logs a `PER_SIDE` entry of 20 kg
- **THEN** the resolved total load is 40 kg

### Requirement: STACK_POSITION carries no mass

The system SHALL treat a `STACK_POSITION` entry as an ordinal label and SHALL NOT derive, estimate, store, or display any mass value for it.

#### Scenario: No mass is produced for a plate entry
- **WHEN** the user logs a `STACK_POSITION` entry of 7
- **THEN** the set records the ordinal 7
- **AND** the set exposes no resolved mass value

#### Scenario: Plate entries are not converted on request
- **WHEN** a client requests a mass value for a `STACK_POSITION` set
- **THEN** the system returns an explicit "not applicable" result rather than a number

### Requirement: Ordinal loads are comparable only within the same exercise

The system SHALL compare `STACK_POSITION` values only between sets of the same exercise, and SHALL NOT order, rank, or aggregate ordinal values across different exercises.

#### Scenario: Same-exercise comparison is allowed
- **GIVEN** two sets of the same plate-mode exercise at ordinals 6 and 7
- **WHEN** progression for that exercise is computed
- **THEN** ordinal 7 is treated as greater than ordinal 6

#### Scenario: Cross-exercise ordinal comparison is refused
- **WHEN** a comparison is requested between a `STACK_POSITION` set of exercise A and a `STACK_POSITION` set of exercise B
- **THEN** the system refuses the comparison rather than returning a result

### Requirement: Mass is stored canonically

The system SHALL store all ratio-scale loads as integer grams internally, and SHALL convert to kilograms or pounds only for display, using the user's display-unit preference.

#### Scenario: Unit preference does not alter stored data
- **GIVEN** a set stored at 60000 grams
- **WHEN** the user switches their display preference from kilograms to pounds
- **THEN** the stored value is unchanged
- **AND** the displayed value is the pound equivalent

#### Scenario: Repeated unit switching does not drift
- **GIVEN** a set logged in kilograms
- **WHEN** the display unit is switched between pounds and kilograms repeatedly
- **THEN** the value displayed in kilograms is identical to the originally logged value each time

### Requirement: Logged sets retain their raw entry and resolution snapshot

The system SHALL persist, for every logged set, the raw value the user entered, its measurement mode, and a snapshot of the parameters used to resolve it, including bar weight, display unit, and the equipment reference.

#### Scenario: Both the entered and resolved values survive
- **WHEN** the user logs a `PER_SIDE` entry of 20 kg against a 20 kg bar
- **THEN** the set retains the raw entry 20 kg
- **AND** the set retains the resolved total 60 kg
- **AND** the set retains the bar weight of 20 kg used at log time

#### Scenario: Later equipment edits do not alter the snapshot
- **GIVEN** a set logged against a bar weight of 20 kg
- **WHEN** that equipment's bar weight is later changed to 15 kg
- **THEN** the stored snapshot for the existing set still records 20 kg

### Requirement: A correction keeps the set's resolution snapshot

Correcting a set's load SHALL resolve the new value with the snapshot stored when the set was logged, not with the equipment's current values. The snapshot itself SHALL NOT change.

#### Scenario: The bar weight changed since the set was logged
- **GIVEN** a set logged as 20 kg per side when the bar weighed 20 kg
- **AND** that equipment's bar weight is now 15 kg
- **WHEN** the set is corrected to 25 kg per side
- **THEN** it resolves to 70 kg
- **AND** its snapshot still records a 20 kg bar

#### Scenario: A per-side set logged without a base weight
- **GIVEN** a Smith set logged as 20 kg per side with no base weight counted
- **WHEN** it is corrected to 30 kg per side
- **THEN** it resolves to 60 kg

#### Scenario: The entered unit is kept
- **GIVEN** a set logged in lb
- **WHEN** it is corrected
- **THEN** its raw entry and its resolved mass are both updated, and the snapshot still records lb
