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

### Requirement: A logged set's reps and load can be corrected

The user SHALL be able to change a logged set's reps and load, both in the open workout and in a finished one. The set's exercise, equipment, measurement mode and the time it was logged SHALL NOT change. The new values SHALL be entered with the app's keypad, not the system keyboard.

#### Scenario: Fixing a typo during the workout
- **GIVEN** an open workout where Bench was logged as 60 kg × 8
- **WHEN** the user edits that set to 60 kg × 10
- **THEN** the done row reads 60 kg × 10

#### Scenario: Correcting a finished workout
- **GIVEN** last Monday's Squat set of 100 kg × 5
- **WHEN** the user corrects it to 102.5 kg × 5 from History
- **THEN** the workout reads 102.5 kg × 5 after a reload

#### Scenario: Correcting a per-side set
- **GIVEN** a Bench set logged as 20 kg per side on a 20 kg bar
- **WHEN** the user corrects it to 25 kg per side
- **THEN** the set resolves to 70 kg

#### Scenario: Correcting a plate set
- **GIVEN** a Leg curl set logged at plate 7
- **WHEN** the user corrects it to plate 8
- **THEN** the set reads plate 8 and still carries no mass

#### Scenario: A plate outside the machine's range
- **WHEN** the user corrects a plate set to a position the machine does not have
- **THEN** the correction is refused and the set keeps its value

#### Scenario: Correcting someone else's set
- **WHEN** a user asks to correct a set id from another user's workout
- **THEN** it is reported as not found and nothing changes

### Requirement: A logged set can be deleted

The user SHALL be able to delete a logged set, both in the open workout and in a finished one. A deleted set SHALL no longer be shown, counted or used as "last time".

#### Scenario: Deleting a duplicate set
- **GIVEN** an open workout where Row's third set was logged twice by mistake
- **WHEN** the user deletes one of them
- **THEN** Row shows three sets

#### Scenario: Deleting the last set of an exercise
- **GIVEN** last Monday's workout had one Calf raise set
- **WHEN** the user deletes it
- **THEN** "last time" for Calf raise comes from the workout before

#### Scenario: Deleting a set again
- **WHEN** a set that was already deleted is deleted again
- **THEN** the API reports it as not found and nothing changes
- **AND** the app shows the set as gone, without an error

#### Scenario: A pending rest alert for a deleted set
- **GIVEN** a rest-end alert is scheduled for a set
- **WHEN** that set is deleted before the alert fires
- **THEN** the alert is not sent

### Requirement: Sets waiting to sync are corrected and deleted on the phone

A set that has not reached the server yet SHALL be corrected or deleted on the phone, with or without a connection. A set the server already has SHALL be corrected or deleted through the server.

#### Scenario: Correcting a set while offline
- **GIVEN** the phone is offline and Bench 60 kg × 8 is waiting to sync
- **WHEN** the user corrects it to 60 kg × 10
- **THEN** the set waiting to sync reads 60 kg × 10
- **AND** only 60 kg × 10 reaches the server when the connection returns

#### Scenario: Deleting a set while offline
- **GIVEN** the phone is offline and a set is waiting to sync
- **WHEN** the user deletes it
- **THEN** it is never sent

#### Scenario: Correcting a synced set while offline
- **GIVEN** the phone is offline and a set the server already has
- **WHEN** the user corrects it
- **THEN** the set returns to its previous values with a message that the change was not saved
