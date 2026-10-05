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
