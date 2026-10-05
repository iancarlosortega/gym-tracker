# Delta Spec — responsive-ui

Capability: taps show their result at once, failed changes are undone visibly, and moving between screens does not hang on a slow network.

## ADDED Requirements

### Requirement: Edits to existing things show at once

When the user changes the display unit, renames or archives a routine, exercise or equipment, edits, removes or reorders a routine's exercises, or reorders routines, the web app SHALL show the change before the server answers, everywhere it is displayed.

#### Scenario: Switching to pounds is instant
- **GIVEN** the user is on Profile with kg chosen
- **WHEN** they choose lb
- **THEN** lb is shown as chosen immediately, before the server answers
- **AND** weights elsewhere in the app read in lb without a reload

#### Scenario: Reordering an exercise is instant
- **GIVEN** a routine with Bench before Row
- **WHEN** the user moves Row up
- **THEN** Row is shown before Bench immediately
- **AND** the move controls stay usable while the change is saved

#### Scenario: Archiving an exercise is instant
- **WHEN** the user archives the exercise "Skullcrusher"
- **THEN** it leaves the exercises list immediately

### Requirement: Rapid taps keep their order

Successive changes to the same thing SHALL be applied in the order they were tapped, and the screen SHALL NOT flicker back to an older state while later changes are still saving.

#### Scenario: Three quick moves
- **GIVEN** a routine with exercises A, B, C, D
- **WHEN** the user moves D up three times quickly
- **THEN** the screen shows D, A, B, C after the last tap without showing an intermediate order again
- **AND** after reload the order is D, A, B, C

#### Scenario: Toggling the unit back and forth
- **WHEN** the user chooses lb and then kg quickly
- **THEN** kg is shown and kg is what the server keeps

### Requirement: A failed change is undone where it was made

When the server rejects or cannot save an instant change, the web app SHALL restore what was there before and SHALL say so next to the thing that changed, with a way to try again where that makes sense.

#### Scenario: Rename fails
- **GIVEN** the server refuses to rename a routine
- **WHEN** the user renames "Push day" to "Push"
- **THEN** the name returns to "Push day"
- **AND** a short message next to it says the change was not saved, with Try again

### Requirement: Changes that need the server's answer say they are working

Creating a routine, exercise or equipment, starting a workout, previewing or applying a recompute and correcting a bar weight SHALL show that they are in progress and SHALL NOT be submitted twice.

#### Scenario: Starting a workout opens its screen at once
- **WHEN** the user starts Push day
- **THEN** the workout screen opens immediately in a starting state
- **AND** it shows the plan once the server confirms the workout

#### Scenario: Starting fails
- **GIVEN** the server cannot start the workout
- **WHEN** the user starts Push day
- **THEN** the workout screen says it could not start, with Try again, and no workout is open

#### Scenario: Creating keeps a short pending state
- **WHEN** the user creates the exercise "Hip thrust"
- **THEN** the create button shows it is saving and cannot be pressed again until the server answers

### Requirement: Navigation does not hang on a weak connection

The installed app SHALL NOT make API requests wait on its service worker, and SHALL show a previously loaded screen when the network is too slow to answer a navigation quickly.

#### Scenario: API reads bypass the service worker
- **WHEN** the app reads data from the API
- **THEN** the service worker does not handle the request

#### Scenario: Slow network falls back to the last copy
- **GIVEN** the user opened Routines before
- **WHEN** they open Routines again on a connection that does not answer within the time limit
- **THEN** the previously loaded Routines screen is shown
- **AND** the fresh copy is stored when the network answers

#### Scenario: A new build is not pinned
- **GIVEN** an installed app with the previous service worker
- **WHEN** a new build is deployed and the app is reopened
- **THEN** the old cached screens are discarded
