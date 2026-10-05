# Delta Spec — rest-timer

Capability: alerting the user when a rest interval ends, including with the device pocketed.

## ADDED Requirements

### Requirement: Rest timer starts from the completed set

The system SHALL offer a rest countdown when a set is logged, defaulting to the rest duration configured for that exercise, and SHALL allow the user to adjust or skip it.

#### Scenario: Default duration comes from the exercise
- **GIVEN** an exercise configured with 180 seconds rest
- **WHEN** the user logs a set of that exercise
- **THEN** a 180-second countdown is offered

#### Scenario: Timer can be skipped
- **WHEN** the user dismisses a running rest countdown
- **THEN** the countdown ends and no alert is delivered for it

### Requirement: Foreground countdown keeps the screen awake

The system SHALL hold a screen wake lock while a rest countdown is running in the foreground, and SHALL release it when the countdown ends or is dismissed.

#### Scenario: Screen stays on during rest
- **GIVEN** a running rest countdown with the application in the foreground
- **WHEN** the configured screen-idle interval elapses
- **THEN** the screen remains on

#### Scenario: Wake lock is released at the end
- **WHEN** the countdown completes
- **THEN** the wake lock is released

#### Scenario: Missing wake lock support degrades without failing
- **GIVEN** a device or context where a screen wake lock cannot be acquired
- **WHEN** a rest countdown starts
- **THEN** the countdown still runs and the failure is not surfaced as an error

### Requirement: Backgrounded rest completion is delivered by push

The system SHALL deliver a notification at the end of a rest interval when the application is backgrounded or the device is locked, using a server-sent push scheduled at the moment the rest interval ends.

#### Scenario: Alert arrives with the app closed
- **GIVEN** an installed application with an active push subscription
- **AND** a 180-second rest interval started before the application was backgrounded
- **WHEN** 180 seconds elapse
- **THEN** a notification is delivered to the device

#### Scenario: Cancelling rest cancels the scheduled push
- **GIVEN** a scheduled rest push
- **WHEN** the user dismisses the countdown before it ends
- **THEN** no notification is delivered

### Requirement: Push unavailability is disclosed rather than silently failing

The system SHALL detect when background notification delivery is unavailable — because the application is not installed to the home screen, permission is not granted, or the push subscription is no longer valid — and SHALL tell the user that pocketed alerts will not arrive.

#### Scenario: Uninstalled application cannot promise pocketed alerts
- **GIVEN** the application is running in a browser tab rather than installed to the home screen
- **WHEN** the user enables pocketed rest alerts
- **THEN** the system states that installation to the home screen is required

#### Scenario: Expired subscription is reported
- **GIVEN** a push subscription that the push service no longer accepts
- **WHEN** the system attempts to schedule or deliver a rest push
- **THEN** the subscription is marked invalid
- **AND** the user is prompted to re-enable notifications

#### Scenario: Foreground timer remains available regardless
- **GIVEN** background notification delivery is unavailable
- **WHEN** the user logs a set
- **THEN** the foreground countdown still runs normally
