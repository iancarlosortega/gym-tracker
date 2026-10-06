# Delta Spec — workout-logging

Capability: correcting and deleting logged sets.

## ADDED Requirements

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
