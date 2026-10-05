# Delta Spec — routines

Capability: the routine editor's exercise order and an empty routine.

## ADDED Requirements

### Requirement: A routine's exercises reorder by drag or by one-step moves

While editing a routine, the user SHALL be able to reorder its exercises by dragging a row by its handle, or with Move up and Move down. The order SHALL be kept.

#### Scenario: Dragging an exercise
- **GIVEN** a routine with Squat, Leg curl, Calf raise
- **WHEN** the user drags Calf raise by its handle to the top
- **THEN** the routine reads Calf raise, Squat, Leg curl

#### Scenario: Moving without dragging
- **WHEN** the user chooses Move up on Leg curl
- **THEN** the routine reads Leg curl, Squat, Calf raise

#### Scenario: Tapping a row still opens it
- **WHEN** the user taps Calf raise outside its handle
- **THEN** its targets open for editing

### Requirement: An empty routine offers adding exercises

A routine with no exercises SHALL say so and SHALL offer Add exercises. That action opens the editor with the exercise picker already showing.

#### Scenario: Adding to an empty routine
- **GIVEN** routine Arms with no exercises
- **WHEN** the user opens it and chooses Add exercises
- **THEN** the exercises they can add are listed, without a separate step into editing
