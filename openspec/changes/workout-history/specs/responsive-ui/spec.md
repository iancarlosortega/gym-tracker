# Delta Spec — responsive-ui

Capability: set corrections and deletions show at once.

## MODIFIED Requirements

### Requirement: Edits to existing things show at once

When the user changes the display unit, renames or archives a routine, exercise or equipment, edits, removes or reorders a routine's exercises, reorders routines, or corrects or deletes a logged set, the web app SHALL show the change before the server answers, everywhere it is displayed.

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

#### Scenario: Correcting a set is instant
- **WHEN** the user corrects a set from 8 to 10 reps
- **THEN** the set reads 10 reps immediately, before the server answers

#### Scenario: Deleting a set is instant
- **WHEN** the user deletes a set
- **THEN** it leaves the list immediately

## ADDED Requirements

### Requirement: Deleting a workout waits for the server

Deleting a whole workout SHALL NOT be applied before the server confirms. While it is being deleted, the action SHALL say it is working, and a failure SHALL leave the workout in place with a message.

#### Scenario: Delete confirmed
- **WHEN** the user confirms Delete workout
- **THEN** the action shows it is working
- **AND** after the server confirms, History opens without that workout

#### Scenario: Delete fails
- **GIVEN** the server cannot be reached
- **WHEN** the user confirms Delete workout
- **THEN** the workout stays, with a message that it was not deleted
