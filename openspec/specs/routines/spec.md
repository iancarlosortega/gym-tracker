# Delta Spec — routines

Capability: user-defined routines, which routine comes next, and managing them from the phone.

## ADDED Requirements

### Requirement: The next routine is the one done longest ago

The system SHALL suggest as next the active routine whose most recent workout is oldest, SHALL rank routines never done before all others, SHALL break ties by the user's routine order, and SHALL never suggest an archived routine.

#### Scenario: Oldest last workout wins
- **GIVEN** active routines A (last done 3 days ago) and B (last done 6 days ago)
- **WHEN** the next routine is determined
- **THEN** B is suggested

#### Scenario: A never-done routine comes first
- **GIVEN** active routine A (last done 10 days ago) and active routine C (never done)
- **WHEN** the next routine is determined
- **THEN** C is suggested

#### Scenario: Ties follow routine order
- **GIVEN** active routines C and D, both never done, with C ordered before D
- **WHEN** the next routine is determined
- **THEN** C is suggested

#### Scenario: Archived routines are never suggested
- **GIVEN** routine E archived and never done, and active routine A
- **WHEN** the next routine is determined
- **THEN** A is suggested

#### Scenario: Nothing to suggest
- **GIVEN** no active routines
- **WHEN** the next routine is determined
- **THEN** no routine is suggested and Home offers to create one

### Requirement: Each routine shows when it was last done

The system SHALL report, for each routine, the start of its most recent workout, or that it was never done.

#### Scenario: Last done reported
- **GIVEN** workouts following Legs on 21 and 28 September
- **WHEN** routines are listed
- **THEN** Legs reads as last done on 28 September

### Requirement: A routine reads as a plan and is edited with large controls

The web app SHALL show a routine as an ordered plan (exercise, sets × reps, rest) with a start action, and SHALL edit one exercise's targets in a sheet with large controls and preset rest durations.

#### Scenario: Reading the plan
- **WHEN** the user opens Legs
- **THEN** each exercise reads in order with its sets, reps and rest
- **AND** "Start Legs" is offered

#### Scenario: Changing an exercise's targets
- **WHEN** the user edits Squat to 4 sets of 6–8 with 3:00 rest and saves
- **THEN** the plan shows Squat as 4 × 6–8, rest 3:00

#### Scenario: Removing an exercise from a routine
- **WHEN** the user removes Calf raise from Legs
- **THEN** Legs no longer lists Calf raise
- **AND** past sets of Calf raise are untouched

### Requirement: Rest follows the routine

The rest timer after a set SHALL use that exercise's rest duration from the routine being followed, and SHALL fall back to three minutes for an empty workout or an exercise outside the routine.

#### Scenario: Routine rest duration
- **GIVEN** a workout following Legs, where Leg curl rests 1:30
- **WHEN** the user logs a set of Leg curl
- **THEN** the rest countdown starts at 1:30

#### Scenario: Fallback rest
- **GIVEN** an empty workout
- **WHEN** the user logs a set
- **THEN** the rest countdown starts at 3:00
### Requirement: User-defined routines

The system SHALL allow the user to create, reorder, rename, and archive routines composed of an ordered list of exercises.

#### Scenario: Routine preserves exercise order
- **WHEN** the user arranges four exercises in a routine
- **THEN** starting a session from that routine presents them in that order

### Requirement: Per-exercise targets within a routine

The system SHALL allow each exercise in a routine to declare a target set count, a target repetition count or range, and a rest duration.

#### Scenario: Rest duration defaults are per exercise
- **GIVEN** a routine where exercise A declares 180 seconds rest and exercise B declares 90 seconds
- **WHEN** the user completes a set of exercise B
- **THEN** the offered rest duration is 90 seconds

#### Scenario: Targets are guidance, not constraints
- **GIVEN** a routine exercise with a target of 3 sets
- **WHEN** the user logs a fourth set during the session
- **THEN** the set is accepted and recorded

### Requirement: Routine edits do not alter past sessions

The system SHALL keep completed sessions unchanged when the routine they were started from is later edited.

#### Scenario: Removing an exercise from a routine preserves history
- **GIVEN** a completed session that included exercise A
- **WHEN** exercise A is removed from the routine
- **THEN** the completed session still shows exercise A and its logged sets
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
