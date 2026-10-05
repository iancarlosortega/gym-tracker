# Delta Spec — workout-logging

Capability: logging a workout set by set, finishing it, and seeing what was done last time.

## ADDED Requirements

### Requirement: A workout can be finished, even offline

The web app SHALL let the user finish an open workout at any time, SHALL treat it as finished on the device immediately, and SHALL deliver the finish once the API is reachable, after any sets still waiting to be sent.

#### Scenario: Finishing online
- **GIVEN** an open workout with every set synced
- **WHEN** the user finishes it
- **THEN** the workout is closed on the server
- **AND** Home no longer shows a workout in progress

#### Scenario: Finishing offline
- **GIVEN** an open workout and no connectivity
- **WHEN** the user finishes it
- **THEN** the device shows no workout in progress
- **AND** the finish is sent once connectivity returns

#### Scenario: Sets queued before an offline finish are kept
- **GIVEN** three sets logged offline and then the workout finished offline
- **WHEN** connectivity returns
- **THEN** all three sets are stored on the server
- **AND** the workout is closed

### Requirement: Late sets belong to the workout they were logged in

The API SHALL accept a set for a finished workout when the set was logged at or before the moment the workout finished, and SHALL refuse a set logged after it.

#### Scenario: Set logged before the finish arrives late
- **GIVEN** a workout finished at 10:30
- **WHEN** a set logged at 10:28 arrives at 10:45
- **THEN** the set is stored in that workout

#### Scenario: Set logged at the finish instant
- **GIVEN** a workout finished at 10:30:00
- **WHEN** a set logged at 10:30:00 arrives
- **THEN** the set is stored

#### Scenario: Set logged after the finish
- **GIVEN** a workout finished at 10:30
- **WHEN** a set logged at 10:31 arrives
- **THEN** the set is refused as belonging to a finished workout

### Requirement: Last time is shown set by set

The workout screen SHALL show, for the current exercise and set number, the load and reps of the same set number in that exercise's most recent earlier workout.

#### Scenario: Same set number from the previous workout
- **GIVEN** Bench press last time: set 1 20 kg/side × 8, set 2 20 kg/side × 7
- **WHEN** the user is on set 2 of Bench press
- **THEN** "Last time · set 2" reads 20 kg/side × 7

#### Scenario: More sets than last time
- **GIVEN** Bench press last time had 3 sets
- **WHEN** the user is on set 4
- **THEN** the card shows that there was no set 4 last time

#### Scenario: First time doing an exercise
- **WHEN** the user logs an exercise never done before
- **THEN** the card shows that there is no previous workout

#### Scenario: Last time unavailable offline
- **GIVEN** no connectivity and nothing read earlier for this exercise
- **WHEN** the workout screen shows the exercise
- **THEN** the card stays in place and reads "Offline · last time unavailable"
- **AND** logging the set still works

### Requirement: Values are entered without the system keyboard

Weight and reps SHALL be entered through the app's own keypad, which appears only while a value is being edited, SHALL never open the device's keyboard, and SHALL be operable with a screen reader.

#### Scenario: Keypad appears on demand
- **WHEN** the user taps the weight
- **THEN** the keypad appears with the weight selected
- **AND** the device keyboard does not appear

#### Scenario: Keypad closes when done
- **WHEN** the user logs the set or closes the keypad
- **THEN** the keypad disappears

#### Scenario: Same as last
- **GIVEN** last time set 2 was 20 kg/side × 7
- **WHEN** the user chooses "Same as last" on set 2
- **THEN** the weight reads 20 kg/side

#### Scenario: Screen reader announces the edited value
- **GIVEN** VoiceOver is on and the weight is being edited
- **WHEN** the user presses 2 then 2 then .5 on the keypad
- **THEN** the new value 22.5 is announced

### Requirement: Reads explain an offline state

Screens that read from the API SHALL show that the device is offline instead of a loading state that never ends, and SHALL show a failure promptly.

#### Scenario: Opening statistics offline
- **GIVEN** no connectivity and nothing cached
- **WHEN** the user opens Progress
- **THEN** the screen says it is offline

#### Scenario: Server unreachable
- **GIVEN** connectivity but the server is down
- **WHEN** a screen reads from it
- **THEN** a failure message appears within five seconds
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
### Requirement: Session logging

The system SHALL allow the user to start a workout session from a routine or ad hoc, log sets against exercises, and finish the session.

#### Scenario: A set records load, reps, and time
- **WHEN** the user logs a set
- **THEN** the set records its load entry, its measurement mode, its repetition count, and the time it was logged

#### Scenario: An unfinished session is resumable
- **GIVEN** a session that was started and not finished
- **WHEN** the user reopens the application
- **THEN** the session is still open with its logged sets intact

### Requirement: Sets are captured without network access

The system SHALL accept and persist logged sets on the device while the device is offline, and SHALL make them visible within the session immediately.

#### Scenario: Logging succeeds with no connectivity
- **GIVEN** the device has no network connection
- **WHEN** the user logs a set
- **THEN** the set is stored locally and displayed in the session
- **AND** no error is shown to the user

#### Scenario: Offline sets survive an app restart
- **GIVEN** sets logged while offline
- **WHEN** the application is closed and reopened while still offline
- **THEN** those sets are still present

### Requirement: Pending sets synchronise when connectivity returns

The system SHALL transmit locally-stored sets to the server once connectivity is available, and SHALL retain them locally until the server confirms receipt.

#### Scenario: Queue drains on reconnect
- **GIVEN** three sets logged offline
- **WHEN** connectivity returns
- **THEN** all three sets are sent to the server
- **AND** they are removed from the pending queue only after the server confirms each one

#### Scenario: Failed transmission does not lose data
- **GIVEN** a pending set whose transmission fails
- **WHEN** the failure occurs
- **THEN** the set remains in the pending queue for a later attempt

#### Scenario: Re-sending a set does not duplicate it
- **GIVEN** a set that was received by the server but whose confirmation did not reach the device
- **WHEN** the device sends that set again
- **THEN** the server records exactly one set

### Requirement: Sync state is visible to the user

The system SHALL indicate how many logged sets are not yet confirmed by the server.

#### Scenario: Pending count is shown
- **GIVEN** two sets awaiting synchronisation
- **WHEN** the user views the session
- **THEN** the interface indicates that two sets are pending

#### Scenario: Storage pressure is surfaced
- **WHEN** local storage for pending sets cannot be written
- **THEN** the user is warned explicitly that the set could not be stored
