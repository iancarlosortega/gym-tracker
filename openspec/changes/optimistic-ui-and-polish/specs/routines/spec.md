# Delta Spec — routines

Capability: the user's own order of routines.

## ADDED Requirements

### Requirement: The user puts routines in their own order

The user SHALL be able to reorder their active routines by dragging a row by its handle or with Move up and Move down actions, and the order SHALL be kept on the server. Routines and up-next ties SHALL follow that order everywhere routines are listed.

#### Scenario: Dragging a routine
- **GIVEN** routines Legs, Pull day, Push day in that order
- **WHEN** the user drags Push day by its handle to the top
- **THEN** the list reads Push day, Legs, Pull day
- **AND** Home and the start sheet list them in that order after reload

#### Scenario: Moving without dragging
- **GIVEN** routines Legs, Pull day, Push day
- **WHEN** the user chooses Move up on Push day
- **THEN** the list reads Legs, Push day, Pull day

#### Scenario: Scrolling the list does not drag
- **WHEN** the user swipes vertically across a routine row outside its handle
- **THEN** the list scrolls and no routine moves

#### Scenario: Ties follow the user's order
- **GIVEN** routines Push day and Legs, both never done, with Push day ordered first by the user
- **WHEN** the next routine is determined
- **THEN** Push day is suggested

### Requirement: Existing and new routines get a place in the order

Routines that existed before ordering SHALL start in alphabetical order, and a newly created routine SHALL be placed last.

#### Scenario: Before the user reorders
- **GIVEN** routines Push day, Legs and Pull day created before ordering existed
- **WHEN** the user opens Routines
- **THEN** they read Legs, Pull day, Push day

#### Scenario: New routine goes last
- **GIVEN** routines Push day, Legs in the user's order
- **WHEN** the user creates Arms
- **THEN** the list reads Push day, Legs, Arms
