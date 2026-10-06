# Delta Spec — workout-history

Capability: looking back at past workouts, reading one, and deleting one.

## ADDED Requirements

### Requirement: Past workouts are listed newest first

The system SHALL list the user's own workouts, newest first by start time, a page at a time. Each workout in the list SHALL show its local day, its routine name (or that it had none), and how many sets it has. A workout that is still open SHALL be marked as in progress.

#### Scenario: Two workouts this week
- **GIVEN** Push day started Thursday 18:10 and Legs started Monday 07:30, both in the phone's zone
- **WHEN** the user opens History
- **THEN** Push day is listed before Legs
- **AND** each shows its local day and its number of sets

#### Scenario: More workouts than one page
- **GIVEN** 45 past workouts and a page size of 20
- **WHEN** the user reaches the end of the list
- **THEN** the next 20 are loaded below, without repeating or skipping any

#### Scenario: Another user's workouts are never listed
- **GIVEN** two users with workouts
- **WHEN** one of them reads History
- **THEN** only their own workouts are returned

#### Scenario: No workouts yet
- **WHEN** a user with no workouts opens History
- **THEN** it says there are no workouts yet

### Requirement: A past workout can be read set by set

Opening a workout SHALL show its sets grouped by exercise, in the order they were logged, with load in the display unit and reps.

#### Scenario: Reading Push day
- **GIVEN** Push day had 3 sets of Bench and 2 of Row
- **WHEN** the user opens it from History
- **THEN** Bench is shown with its 3 sets, then Row with its 2
- **AND** each set reads its load in the user's display unit and its reps

#### Scenario: A workout that is not the user's
- **WHEN** a user asks for a workout id that belongs to someone else
- **THEN** it is reported as not found

### Requirement: A workout can be deleted after confirming

The user SHALL be able to delete a workout from its detail after a confirmation that names it. Deleting it SHALL remove its sets with it, from every place they are shown or counted.

#### Scenario: Deleting a workout started by accident
- **GIVEN** a Legs workout on Tuesday with 1 set
- **WHEN** the user chooses Delete workout and confirms
- **THEN** it leaves History
- **AND** Tuesday is no longer marked as trained in the week strip
- **AND** Legs' "Last done" goes back to its previous workout

#### Scenario: Cancelling the confirmation
- **WHEN** the user chooses Delete workout and then cancels
- **THEN** nothing is deleted

#### Scenario: Deleting the open workout
- **GIVEN** an open workout with 2 sets still waiting to sync
- **WHEN** the user deletes it
- **THEN** its waiting sets are discarded with it, and none of them is sent later
- **AND** a new workout can be started

#### Scenario: Deleting someone else's workout
- **WHEN** a user asks to delete a workout id that belongs to someone else
- **THEN** it is reported as not found and nothing is deleted
