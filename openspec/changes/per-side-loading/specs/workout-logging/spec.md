# Delta Spec — workout-logging

## MODIFIED Requirements

### Requirement: Per-side values are labelled by the equipment

The workout screen SHALL label a per-side value "per hand" on free weights and "per side" otherwise, and SHALL offer every piece of equipment that can measure the exercise.

#### Scenario: Dumbbell bench press offers dumbbells
- **GIVEN** a per-side exercise and free weights "Dumbbells"
- **WHEN** the user picks the equipment
- **THEN** Dumbbells is offered
- **AND** the weight tile reads "Weight per hand"

#### Scenario: Last time per hand
- **GIVEN** last time set 1 was 60 lb per hand × 8 on Dumbbells
- **WHEN** the user logs set 1 on Dumbbells
- **THEN** the card reads "60 lb/hand × 8"
