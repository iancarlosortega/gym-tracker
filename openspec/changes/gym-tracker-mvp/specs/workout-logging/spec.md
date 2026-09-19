# Delta Spec — workout-logging

Capability: recording sets during a workout, including while offline.

## ADDED Requirements

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
