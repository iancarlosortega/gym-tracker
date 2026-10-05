# Delta Spec — display-unit

Capability: Progress and Recompute read in the chosen unit.

## ADDED Requirements

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
