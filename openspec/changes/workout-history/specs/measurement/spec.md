# Delta Spec — measurement

Capability: a corrected set keeps how it was measured.

## ADDED Requirements

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
